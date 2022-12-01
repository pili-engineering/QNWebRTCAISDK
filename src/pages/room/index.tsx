import React, { useEffect, useMemo, useRef, useState } from 'react';
import QNRTC, { QNLocalAudioTrack, QNLocalTrack, QNLocalVideoTrack, QNRTCClient, QNTrack } from 'qnweb-rtc';
import {
  QNAuthoritativeFaceComparer,
  QNFaceDetector,
  QNIDCardDetector,
  QNOCRDetector,
  QNRtcAiManager,
  QNTextToSpeakAnalyzer,
  QNFaceFlashLiveDetector,
  QNAudioToTextAnalyzer,
  QNFaceActionLive,
  QNAuthorityActionFaceComparer, QNFaceComparer
} from 'qnweb-rtc-ai';
import { Button, message, Modal, Switch } from 'antd';
import { SwitchChangeEventHandler } from 'antd/es/switch';

import { request } from '@/api';
import { showAuthFaceModal, showTextToSpeakerModal, filterBigData } from './utils';

import styles from './index.module.scss';

const localCameraTag = 'local-camera';
const localMicTag = 'local-mic';
const isLocalCameraTrack = (track: QNTrack) => track.tag === localCameraTag;

const faceActionMap: Record<string, string> = {
  0: '眨眼',
  4: '抬头',
  5: '低头',
  7: '左右摇头'
};

const Room: React.FC = () => {
  const urlQueryRef = React.useRef<{
    roomToken: string;
  }>({
    roomToken: new URLSearchParams(location.search).get('roomToken') || '',
  });

  const facingModeRef = useRef<'user' | 'environment'>('user');
  const audioToTextRef = useRef<QNAudioToTextAnalyzer | null>(null);

  const [client, setClient] = useState<QNRTCClient>();
  const [localTracks, setLocalTracks] = useState<QNLocalTrack[]>([]);
  const localCameraTrack = useMemo(() => {
    return localTracks.find(isLocalCameraTrack) as QNLocalVideoTrack | null;
  }, [localTracks]);
  const [responseResult, setResponseResult] = useState<string>();

  const [idCardLoading, setIdCardLoading] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [faceActionLiveLoading, setFaceActionLiveLoading] = useState<boolean>(false);
  const [authFaceLoading, setAuthFaceLoading] = useState<boolean>(false);
  const [authFaceWithActionLoading, setAuthFaceWithActionLoading] = useState<boolean>(false);
  const [faceLoading, setFaceLoading] = useState<boolean>(false);
  const [flashLiveLoading, setFlashLiveLoading] = useState<boolean>(false);
  const [faceComparerLoading, setFaceComparerLoading] = useState<boolean>(false);
  const [textToSpeakLoading, setTextToSpeakLoading] = useState<boolean>(false);
  const [isAudioToTextOpen, setIsAudioToTextOpen] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState('');


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
   */
  const onFaceActionLive = () => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }

    setFaceActionLiveLoading(true);
    const client = QNFaceActionLive.create();
    let interTimer: NodeJS.Timer | null = null;
    let codeIndex = 0;
    let count = 3;
    const renderToast = (code: string) => {
      const curCode = code[codeIndex];
      if (interTimer && codeIndex >= code.length) {
        clearInterval(interTimer);
      }
      setToastText(`${faceActionMap[curCode]}：${count}`);

      count--;
      if (count <= 0) {
        count = 3;
        codeIndex++;
      }
    };

    return client.getRequestCode().then(result => {
      const { code = '', session_id } = result.response?.result || {};
      setToastVisible(true);
      client.start(localCameraTrack, {
        session_id
      });
      renderToast(code);
      interTimer = setInterval(() => {
        renderToast(code);
      }, 1000);

      return new Promise(resolve => {
        setTimeout(resolve, code.length * 3000);
      });
    }).then(() => {
      setToastVisible(false);
      setToastText('');
      return client.commit();
    }).then(result => {
      setResponseResult(filterBigData(result));
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => {
      setFaceActionLiveLoading(false);
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
  const onAuthFaceWithAction = () => {
    if (!localCameraTrack) {
      return Modal.error({
        content: `请先开启摄像头`
      });
    }

    const client = QNAuthorityActionFaceComparer.create();
    let interTimer: NodeJS.Timer | null = null;
    let codeIndex = 0;
    let count = 3;
    const renderToast = (code: string) => {
      const curCode = code[codeIndex];
      if (interTimer && codeIndex >= code.length) {
        clearInterval(interTimer);
      }
      setToastText(`${faceActionMap[curCode]}：${count}`);

      count--;
      if (count <= 0) {
        count = 3;
        codeIndex++;
      }
    };
    return showAuthFaceModal().then(authResult => {
      setAuthFaceWithActionLoading(true);
      return client.getRequestCode().then(result => {
        const { code = '', session_id } = result.response?.result || {};
        setToastVisible(true);
        client.start(localCameraTrack, {
          session_id
        }, {
          realname: authResult.realName,
          idcard: authResult.idCard
        });
        renderToast(code);
        interTimer = setInterval(() => {
          renderToast(code);
        }, 1000);

        return new Promise(resolve => {
          setTimeout(resolve, code.length * 3000);
        });
      }).then(() => {
        setToastVisible(false);
        setToastText('');
        return client.commit();
      }).then(result => {
        setResponseResult(filterBigData(result));
      }).catch(error => {
        Modal.error({
          content: error.message
        });
      }).finally(() => {
        setAuthFaceWithActionLoading(false);
      });
    });
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
    new Promise((resolve) => {
      setTimeout(resolve, 3000);
    }).then(() => {
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
      setResponseResult(filterBigData(result));
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
      setTextToSpeakLoading(true);
      return QNTextToSpeakAnalyzer.run({
        content: result.text
      });
    }).then(result => {
      if (result.response?.code === '0') {
        const snd = new Audio(result.response.result.audioUrl);
        return snd.play().catch(error => {
          Modal.error({
            content: error.message
          });
        });
      }
      Modal.error({
        content: result.response?.msg
      });
    }).catch(error => {
      Modal.error({
        content: error.message
      });
    }).finally(() => {
      setTextToSpeakLoading(false);
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
        null,
        {
          onAudioToText: (result) => {
            console.log('result', result);
            setResponseResult(result.bestTranscription.transcribedText);
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

  /**
   * 人脸对比
   * @param event
   */
  const onFaceComparer: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = event.target.files || [];
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imgFile = e.target?.result; //  base64码, 或 e.target 都是一样的
        if (typeof imgFile !== 'string') {
          Modal.error({
            content: '文件类型错误'
          });
          console.error(`文件类型错误: ${imgFile}`);
          return;
        }

        if (!localCameraTrack) {
          Modal.error({
            content: '请先打开摄像头'
          });
          return;
        }

        setFaceComparerLoading(true);
        return QNFaceComparer.run(localCameraTrack, {
          image: imgFile.replace(/^data:image\/\w+;base64,/, ''),
          image_type: 'BASE64',
        }).then(result => {
          setResponseResult(filterBigData(result));
        }).catch(error => {
          Modal.error({
            content: error.message
          });
        }).finally(() => {
          setFaceComparerLoading(false);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return <div className={styles.container}>
    {
      toastVisible ? <div className={styles.toast}>{toastText}</div> : null
    }

    <input
      id="uploadFile"
      style={{ display: 'none' }}
      type="file"
      onChange={onFaceComparer}
    />

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
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onFaceActionLive}
        loading={faceActionLiveLoading}
      >动作活体</Button>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        loading={faceComparerLoading}
        onClick={() => document.getElementById('uploadFile')?.click()}
      >人脸对比</Button>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onAuthFace}
        loading={authFaceLoading}
      >权威人脸对比</Button>
      <Button
        className={styles.tool}
        type="primary"
        size="small"
        onClick={onAuthFaceWithAction}
        loading={authFaceWithActionLoading}
      >动作活体+权威认证</Button>
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
        loading={textToSpeakLoading}
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
