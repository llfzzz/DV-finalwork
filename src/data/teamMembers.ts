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
      title: '',
      description: '',
      skills: [],
      contact: ''
    }
  },
  {
    name: '刘子东',
    avatar: '/assets/icons/lzd.jpg',
    position: '组员',
    role: 'member',
    coverImage: '/assets/images/lzd-bg.jpg',
    shareContent: {
      title: '',
      description: '帅',
      skills: ['纯帅'],
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
      title: '',
      description: '',
      skills: [],
      contact: ''
    }
  },
  {
    name: '周璇',
    avatar: '/assets/icons/zx.jpg',
    position: '组员',
    role: 'member',
    coverImage: '/assets/images/zx-bg.jpg',
    shareContent: {
      title: '',
      description: '',
      skills: [],
      contact: ''
    }
  },
  {
    name: '罗方政',
    avatar: '/assets/icons/lfz.jpeg',
    position: '组员',
    role: 'member',
    coverImage: '/assets/images/lfz-bg.jpg',
    shareContent: {
      title: '',
      description: '',
      skills: [''],
      contact: ''
    }
  }
];

// 创建一个以名字为键的对象，方便通过名字查找成员信息
export const teamMembersMap: Record<string, TeamMember> = teamMembers.reduce((acc, member) => {
  acc[member.name] = member;
  return acc;
}, {} as Record<string, TeamMember>);
