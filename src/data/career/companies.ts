import type { CareerCompany } from '../../types/career';
import type { CareerCompanyId, CityId, LocationId } from '../../types/ids';

const companyId = (value: string) => value as CareerCompanyId;
const cityId = (value: string) => value as CityId;
const locationId = (value: string) => value as LocationId;

export const CAREER_COMPANY_IDS = {
  moscowDigital: companyId('career_company_moscow_digital'),
  moscowAnalytics: companyId('career_company_moscow_analytics'),
  yaroslavlTech: companyId('career_company_yaroslavl_tech'),
  rybinskEngineering: companyId('career_company_rybinsk_engineering'),
  rybinskAutomation: companyId('career_company_rybinsk_automation')
} as const;

export const careerCompanies: CareerCompany[] = [
  {
    id: CAREER_COMPANY_IDS.moscowDigital,
    name: 'Moscow Digital Systems',
    cityId: cityId('moscow'),
    locationId: locationId('msk_presnya_business_center'),
    industry: 'IT и цифровые продукты',
    description: 'Разработка внутренних сервисов и корпоративных информационных систем.'
  },
  {
    id: CAREER_COMPANY_IDS.moscowAnalytics,
    name: 'Capital Analytics',
    cityId: cityId('moscow'),
    locationId: locationId('msk_presnya_bank'),
    industry: 'Финансы и аналитика',
    description: 'Аналитическое подразделение в деловом районе Москвы.'
  },
  {
    id: CAREER_COMPANY_IDS.yaroslavlTech,
    name: 'YarTech Solutions',
    cityId: cityId('yaroslavl'),
    locationId: locationId('yar_frunzensky_ystu'),
    industry: 'IT и автоматизация',
    description: 'Региональная команда цифровизации предприятий и городских организаций.'
  },
  {
    id: CAREER_COMPANY_IDS.rybinskEngineering,
    name: 'Рыбинское инженерное бюро',
    cityId: cityId('rybinsk'),
    locationId: locationId('ryb_severny_engineering_office'),
    industry: 'Инженерия и проектирование',
    description: 'Проектные работы для машиностроительных предприятий города.'
  },
  {
    id: CAREER_COMPANY_IDS.rybinskAutomation,
    name: 'Волга Автоматизация',
    cityId: cityId('rybinsk'),
    locationId: locationId('ryb_severny_plant'),
    industry: 'Промышленная автоматизация',
    description: 'Внедрение цифровых систем на производственных площадках.'
  }
];
