import React from 'react';
import { Menu, MenuProps } from 'antd';

export const livingActions = [
  { key: 'nod', label: '点点头' },
  { key: 'shake', label: '摇摇头' },
  { key: 'blink', label: '眨眨眼' },
  { key: 'mouth', label: '张张嘴' },
];

/**
 * 动作活体菜单
 * @constructor
 */
export const LivingActionMenu: React.FC<MenuProps> = (props) => {
  return <Menu {...props}>
    {
      livingActions.map(action => {
        return <Menu.Item key={action.key}>{action.label}</Menu.Item>;
      })
    }
  </Menu>;
};
