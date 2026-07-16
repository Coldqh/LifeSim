import type {
  CareerCompanyId,
  CareerEmploymentId,
  CityId,
  DegreeProgramId,
  JobId,
  LocationId,
  QualificationId,
  UniversityId
} from './ids';
import type { CalendarDate } from './time';

export type CareerEmploymentType = 'casual' | 'internship' | 'professional';
export type CareerApplicationChannel = 'direct' | 'phone' | 'interview';
export type CareerEmploymentStatus = 'probation' | 'active' | 'ended';
export type CareerEmploymentEndReason = 'resigned' | 'changed_job' | 'dismissed';

export type CareerCompany = {
  id: CareerCompanyId;
  name: string;
  cityId: CityId;
  locationId: LocationId;
  industry: string;
  description: string;
};

export type PlayerQualification = {
  id: QualificationId;
  kind: 'degree';
  degreeProgramId: DegreeProgramId;
  universityId: UniversityId;
  title: string;
  institutionName: string;
  careerTags: string[];
  awardedDay: number;
  awardedOn: CalendarDate;
};

export type CareerEmploymentRecord = {
  id: CareerEmploymentId;
  jobId: JobId;
  companyId?: CareerCompanyId;
  employmentType: CareerEmploymentType;
  status: CareerEmploymentStatus;
  startedDay: number;
  probationEndsDay?: number;
  probationCompletedDay?: number;
  endedDay?: number;
  endReason?: CareerEmploymentEndReason;
};

export type PlayerCareerState = {
  activeEmployment?: CareerEmploymentRecord;
  employmentHistory: CareerEmploymentRecord[];
};

export type CareerResume = {
  qualifications: PlayerQualification[];
  activeEmployment?: CareerEmploymentRecord;
  employmentHistory: CareerEmploymentRecord[];
  completedShiftCount: number;
};
