export interface TeamMember {
  name: string;
  position: string;
  role: 'leader' | 'member';
  avatar?: string;
  coverImage?: string;
  shareContent?: {
    title: string;
    description: string;
    skills: string[];
    contact: string;
  };
}

export const teamMembers: TeamMember[] = [
  {
    name: '王宇盛',
    avatar: '/assets/icons/wys.jpg',
    position: '组长',
    role: 'leader',
    coverImage: '/assets/images/wys-bg.jpg',
    shareContent: {
      title: '让世界都要颤抖的男人',
      description: '亚洲的颜值就靠两个人撑着，彭于晏已经慢慢老去，我不知道还能撑多久，感觉好累！',
      skills: ['长沙彭于晏', '湖财乡里别'],
      contact: 'W_Y_S-Echo'
    }
  },
  {
    name: '刘子东',
    avatar: '/assets/icons/lzd.jpg',
    position: '组员',
    role: 'member',
    coverImage: '/assets/images/lzd-bg.jpg',
    shareContent: {
      title: '全世界最深情的男人',
      description: '你起床有两个选择 一个是盖上被子做你没做完的梦 另一个是掀开被子去完成你未完成的梦',
      skills: ['深情', '纯爱', '篮球', '韭菜'],
      contact: 'lzd06_'
    }
  },
  {
    name: '彭雷',
    avatar: '/assets/icons/pl.jpg',
    position: '组员',
    role: 'member',
    coverImage: '/assets/images/pl-bg.jpg',
    shareContent: {
      title: '让所有人都能启动原神的男人',
      description: '是一个废话特别多的人，喜欢玩原神这种打工的游戏，杂食性动物吃什么都随便',
      skills: ['只玩原神', '爱玩三角粥', '爱叫爱吃'],
      contact: 'o283130718'
    }
  },
  {
    name: '周璇',
    avatar: '/assets/icons/zx.jpg',
    position: '组员',
    role: 'member',
    coverImage: '/assets/images/zx-bg.jpg',
    shareContent: {
      title: '让载物都要避其锋芒的男人',
      description: '他总在暮色漫过窗台时亮起电脑蓝光，用键盘和耳机，在炙热沙城中编织着独属于他的热血江湖',
      skills: ['go学长', '口嗨哥'],
      contact: 'x2295482064'
    }
  },
  {
    name: '罗方政',
    avatar: '/assets/icons/lfz.jpeg',
    position: '组员',
    role: 'member',
    coverImage: '/assets/images/lfz-bg.jpg',
    shareContent: {
      title: '成熟男人',
      description: '梦想C位出道',
      skills: ['唱', '跳', 'rap', '篮球'],
      contact: '我只用扣扣'
    }
  }
];

// 创建一个以名字为键的对象，方便通过名字查找成员信息
export const teamMembersMap: Record<string, TeamMember> = teamMembers.reduce((acc, member) => {
  acc[member.name] = member;
  return acc;
}, {} as Record<string, TeamMember>);
