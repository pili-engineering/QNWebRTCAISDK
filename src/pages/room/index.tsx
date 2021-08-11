import { Button, Input, Modal, Popover } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import useFaceActionLiveDetector from '../../hooks/useFaceActionLiveDetector';
import useRTCJoinRoom from '../../hooks/useRTCJoinRoom';
import useRTCWakeDevice from '../../hooks/useRTCWakeDevice';
import { generateAiToken, generateSignToken } from '../../utils/token';
import * as eruda from 'eruda';
import css from './index.module.scss';

const Room = () => {
  const roomToken = new URLSearchParams(location.search).get('roomToken') || '';
  const { RTCClient, isRTCRoomJoined } = useRTCJoinRoom(roomToken);
  const { localTracks, facingMode, setFacingMode } = useRTCWakeDevice(RTCClient);
  const cameraTrackElement = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [saying, setSaying] = useState(false);
  const audioAnalyzer = useRef<any>(null);
  const [captionText, setCaptionText] = useState<string>(); // 语音转文字字幕
  const targetFileInput = useRef<HTMLInputElement>(null);
  const {
    countdown,
    faceActionLiveDetectorText,
    faceActionLiveDetectorType,
    setFaceActionLiveDetectorType
  } = useFaceActionLiveDetector();
  const [faceActionLiveDetector, setFaceActionLiveDetector] = useState<any>();

  /**
   * 初始化
   */
  useEffect(() => {
    const isDebug = JSON.parse(new URLSearchParams(location.search).get('isDebug'));
    if (isDebug) eruda.init();
    // 初始化 aiToken
    QNRTCAI.init(generateAiToken(), generateSignToken);
  }, []);

  /**
   * debug audioBuffer
   */
  useEffect(() => {
    const isDebug = JSON.parse(new URLSearchParams(location.search).get('isDebug'));
    const audioTrack = localTracks.find(track => track.tag === 'microphone');
    if (audioTrack && isDebug) {
      audioTrack._track.on('audioBuffer', buffer => {
        console.log('audioTrack', buffer);
      });
    }
    /**
     * 播放视频 Track
     */
    localTracks.forEach(track => {
      if (track.tag === 'camera' && cameraTrackElement.current) track.play(cameraTrackElement.current);
    });
  }, [localTracks]);

  /**
   * 离开房间
   */
  useEffect(() => {
    return () => {
      if (RTCClient && isRTCRoomJoined) {
        RTCClient.leave();
        // localTracks.forEach(track => track.release());
      }
    };
  }, [isRTCRoomJoined, RTCClient, localTracks]);

  /**
   * 结束动作活体检测、开始响应识别结果
   */
  useEffect(() => {
    if (
      countdown <= 0 &&
      localTracks.length &&
      faceActionLiveDetectorType &&
      faceActionLiveDetector
    ) {
      faceActionLiveDetector.commit().then(response => {
        Modal.info({
          title: '动作活体检测信息',
          content: JSON.stringify(response, null, 2)
        });
      }).catch(error => {
        Modal.error({
          title: '动作活体检测报错',
          content: `请求失败，http status: ${error.status}`
        });
      }).finally(() => setFaceActionLiveDetector(undefined));
    }
  }, [countdown, faceActionLiveDetectorType, localTracks, faceActionLiveDetector]);

  /**
   * 身份证识别
   */
  const IDCard = () => {
    console.log('身份证识别');
    const cameraTrack = localTracks.find(t => t.tag === 'camera');
    QNRTCAI.IDCardDetector.run(cameraTrack).then((res: any) => {
      Modal.info({
        title: '身份证识别信息',
        content: JSON.stringify(res)
      });
    });
  };

  /**
   * 文字转语音
   */
  const textToSpeak = () => {
    QNRTCAI.textToSpeak({ text }).then(response => {
      const base64String = response.response.audio;
      const snd = new Audio('data:audio/wav;base64,' + base64String);
      snd.play().catch(error => {
        Modal.error({
          title: 'textToSpeak error',
          content: JSON.stringify(error)
        });
      });
    });
  };

  /**
   * 语音转文字
   */
  const speakToText = () => {
    const audioTrack = localTracks.find(t => t.tag === 'microphone');
    console.log('audioTrack', audioTrack);
    if (saying) { // 关闭
      audioAnalyzer.current.stopAudioToText();
    } else { // 开启
      audioAnalyzer.current = QNRTCAI.AudioToTextAnalyzer.startAudioToText(audioTrack, {}, {
        onAudioToText: (message: any) => {
          console.log('message', message);
          const captionText = message.transcript;
          if (captionText) {
            setCaptionText(captionText);
          }
        }
      });
    }
    setSaying(!saying);
  };

  /**
   * 人脸检测
   */
  const faceDetector = () => {
    const cameraTrack = localTracks.find(t => t.tag === 'camera');
    QNRTCAI.faceDetector(cameraTrack).then(response => {
      Modal.info({
        title: '人脸检测信息',
        content: JSON.stringify(response)
      });
    });
  };

  /**
   * 人脸对比
   */
  const faceCompare = () => {
    console.log('人脸对比');
    targetFileInput.current?.click();
  };

  /**
   * 选择文件
   * @param event
   */
  const onChangeFile: React.ChangeEventHandler<HTMLInputElement> = event => {
    const files = event.target.files || [];
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        // base64码
        const imgFile = ev.target?.result; // 或 e.target 都是一样的
        const cameraTrack = localTracks.find(t => t.tag === 'camera');
        if (imgFile) {
          QNRTCAI.faceComparer(cameraTrack, imgFile + '').then(response => {
            Modal.info({
              title: '人脸对比信息',
              content: JSON.stringify(response)
            });
          }).catch(error => {
            Modal.info({
              title: '人脸对比失败',
              content: JSON.stringify(error)
            });
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * 切换前/后置摄像头
   */
  const toggleCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
    localTracks.forEach(track => track.release());
  };

  /**
   * 开始动作活体检测
   * @param actionType
   */
  const onFaceLiveAction = (actionType: string) => {
    const QNRTC = window.QNRTC.default;
    const cameraTrack = localTracks.find(track => track.tag === 'camera');
    const faceActionLiveDetector = QNRTCAI.FaceActionLiveDetector.start(QNRTC, cameraTrack, {
      action_types: [actionType]
    });
    setFaceActionLiveDetector(faceActionLiveDetector);
    setFaceActionLiveDetectorType(actionType);
  };

  return <div className={css.room}>
    <div ref={cameraTrackElement} className={css.cameraTrack}></div>
    <div className={css.toolBox}>
      <Button className={css.toolBtn} size='small' type='primary' onClick={IDCard}>身份证识别</Button>
      <Popover
        trigger='click'
        content={
          <>
            <Button onClick={() => onFaceLiveAction('nod')} className={css.liveAction} size='small'
                    type='primary'>点点头</Button>
            <Button onClick={() => onFaceLiveAction('shake')} className={css.liveAction} size='small'
                    type='primary'>摇摇头</Button>
            <Button onClick={() => onFaceLiveAction('blink')} className={css.liveAction} size='small'
                    type='primary'>眨眨眼</Button>
            <Button onClick={() => onFaceLiveAction('mouth')} className={css.liveAction} size='small'
                    type='primary'>张张嘴</Button>
          </>
        }
      >
        <Button className={css.toolBtn} size='small' type='primary'>动作活体</Button>
      </Popover>
      <Button className={css.toolBtn} size='small' type='primary' onClick={faceDetector}>人脸检测</Button>
      <Button className={css.toolBtn} size='small' type='primary' onClick={faceCompare}>人脸对比</Button>
      <Button className={css.toolBtn} size='small' type='primary' onClick={textToSpeak}>文转音</Button>
      <Button className={css.toolBtn} size='small' type='primary' onClick={toggleCamera}>切换摄像头</Button>
      <Button className={css.toolBtn} size='small' type='primary' onClick={speakToText}>
        {saying ? '关闭' : '开启'}语音转文字
      </Button>
    </div>

    <Input
      placeholder='请输入文字转语音的内容'
      value={text}
      onChange={event => setText(event.target.value)}
    />
    {
      saying && <div className={css.caption}>
        识别结果：{captionText}
      </div>
    }

    <input
      className={css.targetFileInput}
      ref={targetFileInput}
      type='file'
      onChange={onChangeFile}
      accept='image/*'
    />

    {
      faceActionLiveDetectorText &&
      <div className={css.faceActionLiveDetectorToast}>{faceActionLiveDetectorText}：{countdown}</div>
    }
  </div>;
};

export default Room;