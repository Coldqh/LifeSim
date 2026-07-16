import { useState } from 'react';
import { useUiTheme } from '../../state';
import { formatRubles } from '../../core/economy';
import { getLifeActionFailure } from '../../core/actions';
import { adjustActivityNeedsDelta, getNeedSeverity, getNeedsDecayDelta } from '../../core/needs';
import { getHousingById } from '../../data/cities/contentSelectors';
import { formatGameDateShort, formatGameTime, formatWeekday } from '../../core/time';
import type { GameState } from '../../state';
import type { LifeAction } from '../../types/actions';
import type {
  DistrictId,
  LocationId,
  ActionId,
  ProductId,
  JobId,
  EducationProgramId,
  BoxingGymId,
  BoxingTrainerId,
  BoxingTrainingId,
  BoxingOpponentId,
  BoxingTournamentId,
  NpcId,
  NpcInteractionId,
  SocialEventChoiceId,
  BusinessEquipmentId,
  BusinessMenuItemId,
  BusinessPremisesId,
  BusinessSupplyId,
  BusinessUpgradeId,
  UniversityCampusActivityId
} from '../../types/ids';
import type { HousingId } from '../../types/housing';
import type { BusinessEmployeeRole } from '../../types/business';
import type { TravelModeId } from '../../types/transport';
import type { City, District, Location } from '../../types/location';
import type { CareerCompany, CareerEmploymentStatus } from '../../types/career';
import type { Job, JobLevel } from '../../types/job';
import type { EducationProgram } from '../../types/education';
import type { SkillDefinition } from '../../types/skill';
import type { SkillProgressView } from '../../core/progression';
import type { Product, Shop } from '../../types/product';
import type { NeedCondition, NeedsConsequences } from '../../types/needs';
import type { LocationPopulationPresence, PopulationSummary } from '../../types/population';
import type { LifeProgressionPanelState } from '../../types/lifeProgression';
import type { OpportunityJobView } from '../../types/opportunity';
import type { SocialNpcView } from '../../types/relationship';
import type { ActiveSocialEvent, SocialHistoryEntry } from '../../types/socialEvent';
import type { Npc } from '../../types/npc';
import type { ScheduleStatus } from '../../types/schedule';
import type { UniversityCampusActivityDefinition } from '../../types/university';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
import { Icon, type IconName } from '../icons';
import { CharacterScene } from '../visuals';
import { ActionCard } from './ActionCard';
import { createNeedsEffectItems, EffectList } from './EffectList';
import { HousingPanel } from './HousingPanel';
import { HousingMarketPanel, type HousingMarketPanelState } from './HousingMarketPanel';
import { BusinessPanel, type BusinessPanelState } from './BusinessPanel';
import { ConditionPanel } from './ConditionPanel';
import { DevelopmentPanel } from './DevelopmentPanel';
import { InventoryPanel } from './InventoryPanel';
import { JobPanel } from './JobPanel';
import { LifeLog } from './LifeLog';
import { LocationPanel } from './LocationPanel';
import { ShopPanel } from './ShopPanel';
import { StatCard } from './StatCard';
import { SportPanel, type BoxingPanelState } from './SportPanel';
import { LocationPeoplePanel } from './LocationPeoplePanel';
import { PeoplePanel } from './PeoplePanel';
import { SocialEventModal } from './SocialEventModal';
import { UniversityCampusActionCard } from './UniversityCampusActionCard';

type DashboardTab = 'character' | 'city' | 'housing' | 'business' | 'jobs' | 'development' | 'sport' | 'people' | 'log';

type JobView = {
  job: Job;
  location?: Location;
  district?: District;
  company?: CareerCompany;
  employmentStatus?: CareerEmploymentStatus;
  probationDaysRemaining: number;
  jobLevel: JobLevel;
  nextJobLevel?: JobLevel;
  currentLevel: number;
  maxLevel: number;
  isCurrentJob: boolean;
  isAtWorkplace: boolean;
  completedShifts: number;
  jobExperience: number;
  levelExperience: number;
  levelExperienceRequired: number;
  promotionThreshold?: number;
  experienceRemaining: number;
  progressPercent: number;
  isMaxLevel: boolean;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
  canPromote: boolean;
  promotionFailure?: string;
  missingSkillRequirements: Array<{ name: string; currentLevel: number; minLevel: number }>;
  effectiveShiftNeedsDelta: Partial<import('../../types/needs').NeedsState>;
  scheduleStatus: ScheduleStatus;
  opportunity: OpportunityJobView;
};

type DashboardProps = {
  gameState: GameState;
  actions: LifeAction[];
  locationState: {
    city?: City;
    district?: District;
    location?: Location;
    districts: District[];
    locations: Location[];
    shop?: Shop;
    shopProducts: Product[];
    locationScheduleStatus: ScheduleStatus;
    locationScheduleStatuses: Record<string, ScheduleStatus>;
    actionScheduleFailure?: string;
    actionFailures: Record<string, string | undefined>;
    shopScheduleFailure?: string;
    locationTravelOptions: LocationTravelOption[];
    districtTravelOptions: DistrictTravelOption[];
    campusActivities: Array<{ activity: UniversityCampusActivityDefinition; failure?: string }>;
  };
  jobState: {
    jobs: JobView[];
    currentJob?: Job;
    currentJobView?: JobView;
    currentLocationJobs: JobView[];
  };
  educationState: {
    skills: Array<{ skill: SkillDefinition; progress: SkillProgressView }>;
    programs: Array<{
      program: EducationProgram;
      skill?: SkillDefinition;
      location?: Location;
      canStudy: boolean;
      failure?: string;
      scheduleStatus: ScheduleStatus;
      effectiveNeedsDelta: Partial<import('../../types/needs').NeedsState>;
    }>;
  };
  boxingState: BoxingPanelState;
  conditionState: {
    conditions: NeedCondition[];
    consequences: NeedsConsequences;
  };
  populationState: {
    presence?: LocationPopulationPresence;
    summary: PopulationSummary;
  };
  socialState: {
    currentPeople: SocialNpcView[];
    knownPeople: SocialNpcView[];
    colleagues: SocialNpcView[];
    activeEvent?: ActiveSocialEvent;
    activeEventNpc?: Npc;
    history: SocialHistoryEntry[];
    scheduledCount: number;
  };
  housingState: HousingMarketPanelState;
  businessState: BusinessPanelState;
  lifeProgressionState: LifeProgressionPanelState;
  onPerformAction: (actionId: ActionId) => void;
  onPerformUniversityCampusActivity: (activityId: UniversityCampusActivityId) => void;
  onMoveDistrict: (districtId: DistrictId, modeId: TravelModeId) => void;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onBuyProduct: (productId: ProductId) => void;
  onUseInventoryItem: (productId: ProductId) => void;
  onApplyForJob: (jobId: JobId) => void;
  onPromoteJob: (jobId: JobId) => void;
  onWorkShift: (jobId: JobId) => void;
  onResignJob: () => void;
  onStudyProgram: (programId: EducationProgramId) => void;
  onBuyBoxingMembership: (gymId: BoxingGymId) => void;
  onChooseBoxingTrainer: (trainerId: BoxingTrainerId) => void;
  onBoxingTraining: (trainingId: BoxingTrainingId) => void;
  onBoxingSparring: (opponentId: BoxingOpponentId) => void;
  onBoxingTournament: (tournamentId: BoxingTournamentId) => void;
  onInteractWithNpc: (npcId: NpcId, interactionId: NpcInteractionId) => void;
  onExchangeNpcContact: (npcId: NpcId) => void;
  onChooseSocialEvent: (choiceId: SocialEventChoiceId) => void;
  onScheduleHousingViewing: (housingId: HousingId) => void;
  onViewHousing: (housingId: HousingId) => void;
  onRentHousing: (housingId: HousingId) => void;
  onPayHouseholdBills: () => void;
  onOpenBusiness: (premisesId: BusinessPremisesId, name: string) => void;
  onBuyBusinessSupply: (supplyId: BusinessSupplyId, batches?: number) => void;
  onSetBusinessPrice: (itemId: BusinessMenuItemId, price: number) => void;
  onHireBusinessNpc: (npcId: NpcId, role: BusinessEmployeeRole) => void;
  onFireBusinessNpc: (npcId: NpcId) => void;
  onInvestBusiness: (amount: number) => void;
  onBuyBusinessEquipment: (equipmentId: BusinessEquipmentId) => void;
  onBuyBusinessUpgrade: (upgradeId: BusinessUpgradeId) => void;
  onWorkBusinessOwnerShift: () => void;
  onReset: () => void;
};

type NavigationItem = { id: DashboardTab; label: string; icon: IconName };

const NAVIGATION: NavigationItem[] = [
  { id: 'character', label: 'Персонаж', icon: 'character' },
  { id: 'city', label: 'Город', icon: 'city' },
  { id: 'housing', label: 'Жильё', icon: 'home' },
  { id: 'business', label: 'Бизнес', icon: 'building' },
  { id: 'jobs', label: 'Работа', icon: 'work' },
  { id: 'development', label: 'Развитие', icon: 'growth' },
  { id: 'sport', label: 'Спорт', icon: 'boxing' },
  { id: 'people', label: 'Люди', icon: 'users' },
  { id: 'log', label: 'Журнал', icon: 'log' }
];

const MOBILE_PRIMARY_NAVIGATION = NAVIGATION.filter((item) => item.id === 'character' || item.id === 'city');
const MOBILE_MORE_NAVIGATION = NAVIGATION.filter((item) => !MOBILE_PRIMARY_NAVIGATION.includes(item));

const PAGE_TITLES: Record<DashboardTab, { title: string; eyebrow: string }> = {
  character: { title: 'Состояние', eyebrow: 'Личная панель' },
  city: { title: 'Город', eyebrow: 'Москва' },
  housing: { title: 'Жильё', eyebrow: 'Рынок аренды' },
  business: { title: 'Бизнес', eyebrow: 'Собственное предприятие' },
  jobs: { title: 'Работа', eyebrow: 'Карьера' },
  development: { title: 'Развитие', eyebrow: 'Навыки и обучение' },
  sport: { title: 'Спорт', eyebrow: 'Боксёрская карьера' },
  people: { title: 'Люди', eyebrow: 'Знакомства и отношения' },
  log: { title: 'Журнал', eyebrow: 'Хронология' }
};

function needTone(value: number): 'default' | 'good' | 'warning' | 'critical' {
  const severity = getNeedSeverity(value);
  if (severity === 'critical' || severity === 'emergency') return 'critical';
  if (severity === 'warning') return 'warning';
  if (value >= 75) return 'good';
  return 'default';
}


export function Dashboard({
  gameState,
  actions,
  locationState,
  jobState,
  educationState,
  boxingState,
  conditionState,
  populationState,
  socialState,
  housingState,
  businessState,
  lifeProgressionState,
  onPerformAction,
  onPerformUniversityCampusActivity,
  onMoveDistrict,
  onMoveLocation,
  onBuyProduct,
  onUseInventoryItem,
  onApplyForJob,
  onPromoteJob,
  onWorkShift,
  onResignJob,
  onStudyProgram,
  onBuyBoxingMembership,
  onChooseBoxingTrainer,
  onBoxingTraining,
  onBoxingSparring,
  onBoxingTournament,
  onInteractWithNpc,
  onExchangeNpcContact,
  onChooseSocialEvent,
  onScheduleHousingViewing,
  onViewHousing,
  onRentHousing,
  onPayHouseholdBills,
  onOpenBusiness,
  onBuyBusinessSupply,
  onSetBusinessPrice,
  onHireBusinessNpc,
  onFireBusinessNpc,
  onInvestBusiness,
  onBuyBusinessEquipment,
  onBuyBusinessUpgrade,
  onWorkBusinessOwnerShift,
  onReset
}: DashboardProps) {
  const { player, time, lastResult } = gameState;
  const housing = getHousingById(player.housingId);
  const [activeTab, setActiveTab] = useState<DashboardTab>('character');
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const { theme, toggleTheme } = useUiTheme();
  const activeHourDecayItems = createNeedsEffectItems(getNeedsDecayDelta(60, 'active'));
  const page = activeTab === 'city'
    ? { title: 'Город', eyebrow: locationState.city?.name ?? 'Город' }
    : PAGE_TITLES[activeTab];

  function handleResetClick(): void {
    if (window.confirm('Сбросить сохранение LifeSim? Это действие нельзя отменить.')) onReset();
  }

  return (
    <main className={`app-frame ${mobileMoreOpen ? 'mobile-more-open' : ''}`}>
      <div className="ambient-canvas" aria-hidden="true"><i/><i/><i/><span/></div>

      <aside className="desktop-navigation" aria-label="Навигация LifeSim">
        <div className="brand-block" aria-label="LifeSim">
          <span className="brand-block__mark">LS<i /></span>
          <div><strong>LIFESIM</strong><small>URBAN LIFE SYSTEM</small></div>
        </div>

        <nav className="primary-navigation" aria-label="Разделы игры">
          {NAVIGATION.map((item) => (
            <button
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={`navigation-item ${activeTab === item.id ? 'navigation-item--active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
            >
              <span className="navigation-item__icon"><Icon name={item.icon} size={20} /></span>
              <span>{item.label}</span>
              <i className="navigation-item__signal" />
            </button>
          ))}
        </nav>

        <div className="navigation-motto">
          <Icon name="sparkle" size={17} />
          <span>Твой город.<br/>Твоя история.</span>
        </div>

        <div className="desktop-navigation__footer">
          <button className="utility-button" type="button" onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>
          <button className="utility-button utility-button--danger" type="button" onClick={handleResetClick}>
            <Icon name="reset" size={18} /><span>Сбросить игру</span>
          </button>
        </div>
      </aside>

      <section className="app-workspace">
        <header className="top-status-bar">
          <div className="page-identity">
            <span>{page.eyebrow}</span>
            <h1>{page.title}</h1>
          </div>

          <div className="global-status" aria-label="Текущее состояние">
            <div className="global-status__item global-status__item--location">
              <Icon name="pin" size={17} />
              <div><span>{locationState.district?.name ?? 'Район'}</span><strong>{locationState.location?.name ?? 'Место'}</strong></div>
            </div>
            <div className="global-status__item">
              <Icon name="clock" size={17} />
              <div><span>{formatGameDateShort(time)} · {formatWeekday(time.weekday)}</span><strong>{formatGameTime(time)}</strong></div>
            </div>
            <div className="global-status__item global-status__item--money">
              <Icon name="wallet" size={17} />
              <div><span>Баланс</span><strong>{formatRubles(player.money)}</strong></div>
            </div>
            <button className="icon-button top-theme-toggle" aria-label="Переключить тему" type="button" onClick={toggleTheme}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
            </button>
          </div>
        </header>

        <div className="workspace-content">
          {lastResult ? (
            <section className={`activity-notice ${lastResult.ok ? 'activity-notice--success' : 'activity-notice--error'}`}>
              <div className="activity-notice__icon"><Icon name={lastResult.ok ? 'sparkle' : 'close'} size={18} /></div>
              <div><span>{lastResult.actionName ?? 'Последнее действие'}</span><strong>{lastResult.messages[0] ?? 'Состояние обновлено'}</strong></div>
              {lastResult.messages.length > 1 ? <small>+{lastResult.messages.length - 1}</small> : null}
            </section>
          ) : null}

          {activeTab === 'character' ? (
            <section className="screen screen-enter character-screen">
              <section className="profile-command-panel visual-panel">
                <CharacterScene initial={player.name.slice(0, 1).toUpperCase()} cityName={locationState.city?.name ?? 'Москва'} day={time.day} />
                <div className="profile-command-panel__overlay">
                  <div className="profile-command-panel__identity">
                    <div className="profile-avatar" aria-hidden="true">{player.name.slice(0, 1).toUpperCase()}</div>
                    <div><span className="section-kicker">Персонаж</span><h2>{player.name}</h2><p>{player.age} лет · {locationState.city?.name ?? 'Москва'}</p></div>
                  </div>
                  <div className="profile-command-panel__quick">
                    <div><span>Жильё</span><strong>{housing?.name ?? 'Нет жилья'}</strong></div>
                    <div><span>Работа</span><strong>{jobState.currentJobView?.jobLevel.title ?? 'Нет работы'}</strong></div>
                    <div><span>Сейчас</span><strong>{formatGameTime(time)}</strong></div>
                  </div>
                </div>
              </section>

              <ConditionPanel conditions={conditionState.conditions} consequences={conditionState.consequences} />

              <section className="panel vitals-panel visual-panel">
                <div className="vitals-panel__aurora" aria-hidden="true" />
                <div className="section-heading">
                  <div><span className="section-kicker">Состояние</span><h2>Показатели жизни</h2></div>
                  <div className="decay-summary"><span>Расход за активный час</span><EffectList items={activeHourDecayItems} /></div>
                </div>

                <div className="vitals-grid" aria-label="Состояние игрока">
                  <StatCard icon="energy" label="Энергия" value={player.needs.energy} progress={player.needs.energy} tone={needTone(player.needs.energy)} />
                  <StatCard icon="food" label="Сытость" value={player.needs.hunger} progress={player.needs.hunger} tone={needTone(player.needs.hunger)} />
                  <StatCard icon="water" label="Вода" value={player.needs.thirst} progress={player.needs.thirst} tone={needTone(player.needs.thirst)} />
                  <StatCard icon="heart" label="Здоровье" value={player.needs.health} progress={player.needs.health} tone={needTone(player.needs.health)} />
                  <StatCard icon="smile" label="Настроение" value={player.needs.mood} progress={player.needs.mood} tone={needTone(player.needs.mood)} />
                </div>
              </section>

              <div className="character-data-grid">
                <HousingPanel housing={housing} player={player} household={housingState.household} />
                <InventoryPanel inventory={player.inventory} onUseInventoryItem={onUseInventoryItem} />
              </div>
            </section>
          ) : null}

          {activeTab === 'city' ? (
            <section className="screen screen-enter city-screen">
              <div className="city-main-column">
                <LocationPanel
                  city={locationState.city}
                  district={locationState.district}
                  location={locationState.location}
                  districtTravelOptions={locationState.districtTravelOptions}
                  locationTravelOptions={locationState.locationTravelOptions}
                  locationJobs={jobState.currentLocationJobs}
                  currentScheduleStatus={locationState.locationScheduleStatus}
                  locationScheduleStatuses={locationState.locationScheduleStatuses}
                  onMoveDistrict={onMoveDistrict}
                  onMoveLocation={onMoveLocation}
                  onApplyForJob={onApplyForJob}
                />
              </div>

              <aside className="context-column">
                <LocationPeoplePanel presence={populationState.presence} summary={populationState.summary} />
                <ShopPanel locationAddress={locationState.location?.address} locationName={locationState.location?.name} shop={locationState.shop} products={locationState.shopProducts} scheduleStatus={locationState.locationScheduleStatus} scheduleFailure={locationState.shopScheduleFailure} onBuyProduct={onBuyProduct} />
                <section className="panel actions-panel visual-panel">
                  <div className="actions-panel__beam" aria-hidden="true" />
                  <div className="section-heading section-heading--compact">
                    <div><span className="section-kicker">Текущее место</span><h2>Действия</h2></div>
                    <span className="section-counter">{actions.length + locationState.campusActivities.length}</span>
                  </div>
                  {actions.length > 0 || locationState.campusActivities.length > 0 ? (
                    <div className="actions-list">
                      {actions.map((action) => (
                        <ActionCard
                          action={action}
                          failure={locationState.actionFailures[String(action.id)] ?? getLifeActionFailure(player, action)}
                          effectiveNeedsDelta={adjustActivityNeedsDelta(
                            player.needs,
                            action.needsDelta,
                            {
                              scaleEnergyCost: true,
                              scaleEnergyRecovery: action.category === 'sleep' || action.category === 'rest'
                            }
                          )}
                          key={action.id}
                          onPerform={onPerformAction}
                        />
                      ))}
                      {locationState.campusActivities.map(({ activity, failure }) => (
                        <UniversityCampusActionCard
                          activity={activity}
                          effectiveNeedsDelta={adjustActivityNeedsDelta(
                            player.needs,
                            activity.needsDelta,
                            { scaleEnergyCost: true, scaleEnergyRecovery: true }
                          )}
                          failure={failure}
                          key={activity.id}
                          onPerform={onPerformUniversityCampusActivity}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state compact-empty-state">Нет доступных действий</div>
                  )}
                </section>
              </aside>
            </section>
          ) : null}

          {activeTab === 'housing' ? (
            <section className="screen screen-enter housing-market-screen">
              <HousingMarketPanel
                state={housingState}
                currentLocationId={player.locationId}
                onMoveLocation={onMoveLocation}
                onScheduleViewing={onScheduleHousingViewing}
                onViewHousing={onViewHousing}
                onRentHousing={onRentHousing}
                onPayHouseholdBills={onPayHouseholdBills}
              />
            </section>
          ) : null}

          {activeTab === 'business' ? (
            <section className="screen screen-enter business-screen">
              <BusinessPanel
                state={businessState}
                playerMoney={player.money}
                onOpenBusiness={onOpenBusiness}
                onBuySupply={onBuyBusinessSupply}
                onSetPrice={onSetBusinessPrice}
                onHireNpc={onHireBusinessNpc}
                onFireNpc={onFireBusinessNpc}
                onInvest={onInvestBusiness}
                onBuyEquipment={onBuyBusinessEquipment}
                onBuyUpgrade={onBuyBusinessUpgrade}
                onOwnerShift={onWorkBusinessOwnerShift}
              />
            </section>
          ) : null}

          {activeTab === 'jobs' ? <section className="screen screen-enter narrow-screen"><JobPanel currentJobView={jobState.currentJobView} colleagues={socialState.colleagues} onInteract={onInteractWithNpc} onPromoteJob={onPromoteJob} onWorkShift={onWorkShift} onResignJob={onResignJob} /></section> : null}
          {activeTab === 'development' ? <section className="screen screen-enter narrow-screen"><DevelopmentPanel skills={educationState.skills} programs={educationState.programs} progression={lifeProgressionState} onStudyProgram={onStudyProgram} /></section> : null}
          {activeTab === 'sport' ? <section className="screen screen-enter sport-screen"><SportPanel state={boxingState} currentDay={time.day} onBuyMembership={onBuyBoxingMembership} onChooseTrainer={onChooseBoxingTrainer} onTraining={onBoxingTraining} onSparring={onBoxingSparring} onTournament={onBoxingTournament} onOpenCity={() => setActiveTab('city')} /></section> : null}
          {activeTab === 'people' ? <section className="screen screen-enter people-screen"><PeoplePanel currentPeople={socialState.currentPeople} knownPeople={socialState.knownPeople} scheduledCount={socialState.scheduledCount} history={socialState.history} onInteract={onInteractWithNpc} onExchangeContact={onExchangeNpcContact} /></section> : null}
          {activeTab === 'log' ? <section className="screen screen-enter narrow-screen"><LifeLog entries={gameState.lifeLog} /></section> : null}
        </div>
      </section>

      <SocialEventModal event={socialState.activeEvent} npc={socialState.activeEventNpc} onChoose={onChooseSocialEvent} />

      <nav className="mobile-navigation" aria-label="Мобильная навигация">
        {MOBILE_PRIMARY_NAVIGATION.map((item) => (
          <button
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={activeTab === item.id ? 'mobile-navigation__item mobile-navigation__item--active' : 'mobile-navigation__item'}
            key={item.id}
            type="button"
            onClick={() => { setActiveTab(item.id); setMobileMoreOpen(false); }}
          >
            <Icon name={item.icon} size={21} /><span>{item.label}</span>
          </button>
        ))}
        <button
          aria-expanded={mobileMoreOpen}
          className={`mobile-navigation__item mobile-navigation__more ${MOBILE_MORE_NAVIGATION.some((item) => item.id === activeTab) ? 'mobile-navigation__item--active' : ''}`}
          type="button"
          onClick={() => setMobileMoreOpen((open) => !open)}
        >
          <span className="mobile-navigation__dots" aria-hidden="true"><i/><i/><i/></span><span>Больше</span>
        </button>
      </nav>

      <div className={`mobile-more-layer ${mobileMoreOpen ? 'is-open' : ''}`} aria-hidden={!mobileMoreOpen}>
        <button className="mobile-more-backdrop" type="button" aria-label="Закрыть меню" onClick={() => setMobileMoreOpen(false)} />
        <section className="mobile-more-sheet" aria-label="Остальные разделы">
          <header>
            <div><span>LifeSim</span><strong>Больше</strong></div>
            <small>{MOBILE_MORE_NAVIGATION.length} разделов</small>
          </header>
          <div className="mobile-more-grid">
            {MOBILE_MORE_NAVIGATION.map((item) => (
              <button
                className={activeTab === item.id ? 'is-active' : ''}
                key={item.id}
                type="button"
                onClick={() => { setActiveTab(item.id); setMobileMoreOpen(false); }}
              >
                <Icon name={item.icon} size={22}/><span>{item.label}</span>
              </button>
            ))}
          </div>
          <footer>
            <button type="button" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18}/><span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span></button>
            <button className="danger" type="button" onClick={handleResetClick}><Icon name="reset" size={18}/><span>Сбросить игру</span></button>
          </footer>
        </section>
      </div>
    </main>
  );
}
