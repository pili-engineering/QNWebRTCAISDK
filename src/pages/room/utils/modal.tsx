import React, { CSSProperties } from 'react';
import { Input, Modal } from 'antd';

/**
 * 权威认证弹窗
 */
export const showAuthFaceModal = (): Promise<{
  realName: string,
  idCard: string,
}> => {
  return new Promise((resolve) => {
    const inputStyle: CSSProperties = {
      marginBottom: 10
    };
    Modal.confirm({
      title: '权威人脸对比',
      content: <div>
        <Input placeholder="请输入姓名" id="realName" style={inputStyle}/>
        <Input placeholder="请输入身份证号" id="idCard" style={inputStyle}/>
      </div>,
      onOk() {
        const realName = document.querySelector<HTMLInputElement>('#realName')?.value || '';
        const idCard = document.querySelector<HTMLInputElement>('#idCard')?.value || '';
        resolve({ realName, idCard });
      },
      cancelText: '取消',
      okText: '确定'
    });
  });
};

/**
 * 文字转语音弹窗
 */
export const showTextToSpeakerModal = (): Promise<{
  text: string,
}> => {
  return new Promise((resolve) => {
    const inputStyle: CSSProperties = {
      marginBottom: 10
    };
    Modal.confirm({
      title: '文字转语音',
      content: <div>
        <Input placeholder="请输入..." id="textSpeaker" style={inputStyle}/>
      </div>,
      onOk() {
        const text = document.querySelector<HTMLInputElement>('#textSpeaker')?.value || '';
        resolve({ text });
      },
      cancelText: '取消',
      okText: '确定'
    });
  });
};
