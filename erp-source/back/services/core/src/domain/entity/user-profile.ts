export interface UserProfile {
  personal: {
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '';
    bio: string;
    avatarUrl: string;
  };
  work: {
    employeeId: string;
    department: string;
    jobTitle: string;
    manager: string;
    workLocation: 'office' | 'remote' | 'hybrid' | '';
    joinDate: string;
    skills: string[];
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  social: {
    linkedin: string;
    github: string;
    twitter: string;
    website: string;
    slack: string;
  };
}

export const DEFAULT_PROFILE: UserProfile = {
  personal: {
    phone: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
    avatarUrl: '',
  },
  work: {
    employeeId: '',
    department: '',
    jobTitle: '',
    manager: '',
    workLocation: '',
    joinDate: '',
    skills: [],
  },
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  social: {
    linkedin: '',
    github: '',
    twitter: '',
    website: '',
    slack: '',
  },
};
