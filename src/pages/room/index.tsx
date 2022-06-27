import React, { useEffect, useMemo, useRef, useState } from 'react';
import QNRTC, { QNLocalAudioTrack, QNLocalTrack, QNLocalVideoTrack, QNRTCClient, QNTrack } from 'qnweb-rtc';
import {
  QNAuthoritativeFaceComparer,
  QNFaceActionLive,
  QNFaceDetector,
  QNIDCardDetector,
  QNOCRDetector,
  QNRtcAiManager,
  QNTextToSpeakAnalyzer,
  QNFaceActionLiveParams,
  QNAuthorityActionFaceComparer,
  QNFaceFlashLiveDetector,
  QNAudioToTextAnalyzer
} from 'qnweb-rtc-ai';
import { Button, Dropdown, MenuProps, message, Modal, Switch } from 'antd';
import { SwitchChangeEventHandler } from 'antd/es/switch';
import { DownOutlined } from '@ant-design/icons';

import { request } from '@/api';
import { LivingActionMenu } from './components';
import { showAuthFaceModal, showTextToSpeakerModal } from './utils';
import { createTimeoutTask } from './utils';

import styles from './index.module.scss';

const localCameraTag = 'local-camera';
const localMicTag = 'local-mic';
const isLocalCameraTrack = (track: QNTrack) => track.tag === localCameraTag;

const Room: React.FC = () => {
  const urlQueryRef = React.useRef<{
    roomToken: string;
  }>({
    roomToken: new URLSearchParams(location.search).get('roomToken') || '',
  });

  const [client, setClient] = useState<QNRTCClient>();
  const [localTracks, setLocalTracks] = useState<QNLocalTrack[]>([]);
  const localCameraTrack = useMemo(() => {
    return localTracks.find(isLocalCameraTrack) as QNLocalVideoTrack | null;
  }, [localTracks]);
  const [responseResult, setResponseResult] = useState<string>();

  const [idCardLoading, setIdCardLoading] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [livingActionLoading, setLivingActionLoading] = useState<boolean>(false);
  const [authFaceLoading, setAuthFaceLoading] = useState<boolean>(false);
  const [authFaceWithActionLoading, setAuthFaceWithActionLoading] = useState<boolean>(false);
  const [faceLoading, setFaceLoading] = useState<boolean>(false);
  const [flashLiveLoading, setFlashLiveLoading] = useState<boolean>(false);
  const [isAudioToTextOpen, setIsAudioToTextOpen] = useState<boolean>(false);

  const facingModeRef = useRef<'user' | 'environment'>('user');
  const audioToTextRef = useRef<QNAudioToTextAnalyzer | null>(null);

  /**
   * 初始化ai相关的token
   */
  useEffect(() => {
    request.get<undefined, { aiToken: string; signToken?: string }>('/v1/exam/aiToken').then(result => {
      QNRtcAiManager.init(result.aiToken, async (url) => {
        const result = await request.get<{ url: string }, { aiToken: string; signToken: string }>(`/v1/exam/aiToken`, {
          url: encodeURIComponent(url)
        });
        return result.signToken || '';
      });
    });
  }, []);

  /**
   * 初始化 rtc client
   */
  useEffect(() => {
    if (!client) {
      setClient(QNRTC.createClient());
    }
  }, [client]);

  /**
   * 1. 加入房间
   * 2. 开启摄像头和麦克风
   */
  useEffect(() => {
    const roomToken = urlQueryRef.current.roomToken;
    if (client) {
      message.loading({
        content: '加入房间中...',
        duration: 0,
        key: 'joinRoom'
      });
      let localTracks: QNLocalTrack[] = [];
      client.join(roomToken).then(() => {
        message.success('加入房间成功');
        message.loading({
          content: '正在开启摄像头和麦克风...',
          duration: 0,
          key: 'enableCameraAndMic'
        });
        return Promise.all([
          QNRTC.createCameraVideoTrack({
            tag: localCameraTag,
            facingMode: facingModeRef.current,
          }),
          QNRTC.createMicrophoneAudioTrack({
            tag: localMicTag
          })
        ]);
      }).then((tracks) => {
        localTracks = tracks;
        setLocalTracks(localTracks);
        const localCameraTrack = localTracks.find(isLocalCameraTrack);
        const localCameraElement = document.querySelector<HTMLDivElement>('#local-camera');
        if (localCameraTrack && localCameraElement) {
          localCameraTrack.play(localCameraElement).catch(error => {
            Modal.error({
              content: error.message
            });
          });
        }
        message.success('摄像头和麦克风开启成功');
      }).catch(error => {
        Modal.error({
          content: error.message
        });
      }).finally(() => {
        message.destroy('joinRoom');
        message.destroy('enableCameraAndMic');
      });
      return () => {
        message.destroy('joinRoom');
        message.destroy('enableCameraAndMic');
        localTracks.forEach(t => t.destroy());
        client.leave();
      };
    }
  }, [client]);

  /**
   * 切换摄像头
   */
  const onToggleCamera = () => {
    // 销毁旧的摄像头 track
    const localCameraTrack = localTracks.find(isLocalCameraTrack);
    if (!localCameraTrack) return;
    localCameraTrack.destroy();
    setLocalTracks(prev => prev.filter(t => !isLocalCameraTrack(t)));

    // 创建新的摄像头 track
    facingModeRef.current = facingModeRef.current === 'user' ? 'environment' : 'user';
    QNRTC.createCameraVideoTrack({
      facingMode: facingModeRef.current,
      tag: localCameraTag,
    }).then(track => {
      setLocalTracks(prev => [...prev, track]);
      const localCameraElement = document.querySelector<HTMLDivElement>(`#${localCameraTag}`);
      if (localCameraElement) {
        return track.play(localCameraElement);
      }
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    });
  };

  /**
   * 身份证识别
   */
  const onIdCard = () => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }
    setIdCardLoading(true);
    return QNIDCardDetector.run(
      localCameraTrack
    ).then(result => {
      setResponseResult(JSON.stringify(result.response));
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => setIdCardLoading(false));
  };

  /**
   * 动作活体
   * @param event
   */
  const onLivingAction: MenuProps['onClick'] = ({ key }) => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }
    setLivingActionLoading(true);
    type Action = QNFaceActionLiveParams['action_types'][number];
    const detector = QNFaceActionLive.start(localCameraTrack, {
      action_types: [key as Action],
      video_type: 1
    });
    const task = createTimeoutTask(3000);
    task.run().then(() => {
      return detector.commit();
    }).then(result => {
      setResponseResult(JSON.stringify(
        Object.assign(result.response, {
          best_frames: result.response.best_frames.map(item => {
            return { quality: item.quality };
          })
        })
      ));
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => {
      setLivingActionLoading(false);
    });
  };

  /**
   * 权威人脸对比
   */
  const onAuthFace = () => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }
    showAuthFaceModal().then(result => {
      setAuthFaceLoading(true);
      return QNAuthoritativeFaceComparer.run(
        localCameraTrack,
        {
          realname: result.realName,
          idcard: result.idCard
        }
      );
    }).then(result => {
      setResponseResult(JSON.stringify(result.response));
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => setAuthFaceLoading(false));
  };

  /**
   * 动作活体+权威认证
   */
  const onAuthFaceWithAction: MenuProps['onClick'] = ({ key }) => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }
    type Action = QNFaceActionLiveParams['action_types'][number];
    let detector: QNAuthorityActionFaceComparer | null = null;
    showAuthFaceModal().then(result => {
      setAuthFaceWithActionLoading(true);
      detector = QNAuthorityActionFaceComparer.start(
        localCameraTrack,
        { action_types: [key as Action], video_type: 1 },
        {
          realname: result.realName,
          idcard: result.idCard
        }
      );
      const task = createTimeoutTask(3000);
      return task.run();
    }).then(() => {
      if (detector) {
        return detector.commit();
      }
      return Promise.reject(new TypeError('detector is null'));
    }).then(result => {
      setResponseResult(JSON.stringify({
        faceActionResult: Object.assign(result.faceActionResult.response, {
          best_frames: result.faceActionResult.response.best_frames.map(item => {
            return { quality: item.quality };
          })
        }),
        authoritativeFaceResult: result.authoritativeFaceResult.response,
      }));
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => setAuthFaceWithActionLoading(false));
  };

  /**
   * 光线活体
   */
  const onFlashLive = () => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }
    setFlashLiveLoading(true);
    const detector = QNFaceFlashLiveDetector.start(localCameraTrack);
    const task = createTimeoutTask(3000);
    task.run().then(() => {
      return detector.commit();
    }).then(result => {
      setResponseResult(JSON.stringify(result.response));
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => setFlashLiveLoading(false));
  };

  /**
   * 人脸检测
   */
  const onFace = () => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }
    setFaceLoading(true);
    QNFaceDetector.run(localCameraTrack).then(result => {
      setResponseResult(JSON.stringify(Object.assign(result.response, {
        face: result.response.face.map(({ face_aligned_b64, ...rest }) => rest)
      })));
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => setFaceLoading(false));
  };

  /**
   * 文字转语音
   */
  const onTextSpeaker = () => {
    showTextToSpeakerModal().then(result => {
      return QNTextToSpeakAnalyzer.run({
        text: result.text
      });
    }).then(result => {
      const audioElement = new Audio(`data:audio/wav;base64,${result.response.audio}`);
      return audioElement.play();
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    });
  };

  /**
   * 语音转文字
   * @param checked
   */
  const onAudioToTextChange: SwitchChangeEventHandler = (checked) => {
    const localMicTrack = localTracks.find(t => t.tag === localMicTag) as QNLocalAudioTrack | null;
    if (!localMicTrack) {
      return Modal.error({
        content: `请先开启麦克风`
      });
    }
    if (checked) {
      audioToTextRef.current = QNAudioToTextAnalyzer.startAudioToText(
        localMicTrack,
        { hot_words: '清楚,10;清晰,1' },
        {
          onAudioToText: (message) => {
            console.log('message', message);
            const captionText = message.transcript;
            if (captionText) {
              setResponseResult(captionText);
            }
          }
        }
      );
    } else {
      audioToTextRef.current?.stopAudioToText();
    }
    setIsAudioToTextOpen(checked);
  };

  /**
   * ocr识别
   */
  const onOcr = () => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }
    setOcrLoading(true);
    QNOCRDetector.run(localCameraTrack).then(result => {
      setResponseResult(JSON.stringify(result.response));
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => setOcrLoading(false));
  };

  return <div className={styles.container}>
    <div id={localCameraTag} className={styles.localCamera}/>
    <div className={styles.tools}>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onToggleCamera}
      >切换摄像头</Button>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onIdCard}
        loading={idCardLoading}
      >身份证识别</Button>
      <Dropdown.Button
        className={styles.tool}
        type="primary"
        size="small"
        overlay={<LivingActionMenu onClick={onLivingAction}/>}
        icon={<DownOutlined/>}
        loading={livingActionLoading}
      >
        动作活体
      </Dropdown.Button>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onAuthFace}
        loading={authFaceLoading}
      >权威人脸对比</Button>
      <Dropdown.Button
        className={styles.tool}
        type="primary"
        size="small"
        overlay={<LivingActionMenu onClick={onAuthFaceWithAction}/>}
        icon={<DownOutlined/>}
        loading={authFaceWithActionLoading}
      >
        动作活体+权威认证
      </Dropdown.Button>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        loading={flashLiveLoading}
        onClick={onFlashLive}
      >光线活体</Button>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onFace}
        loading={faceLoading}
      >人脸检测</Button>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onTextSpeaker}
      >文转音</Button>
      <Switch
        checkedChildren="开启语音转文字"
        unCheckedChildren="关闭语音转文字"
        checked={isAudioToTextOpen}
        onChange={onAudioToTextChange}
      />
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onOcr}
        loading={ocrLoading}
      >ocr识别</Button>
    </div>
    <div className={styles.response}>{responseResult}</div>
  </div>;
};

export default Room;
