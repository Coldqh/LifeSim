import { formatRubles } from '../../core/economy';
import type { SkillProgressView } from '../../core/progression';
import type { EducationProgram } from '../../types/education';
import type { EducationProgramId } from '../../types/ids';
import type { Location } from '../../types/location';
import type { NeedsState } from '../../types/needs';
import type { SkillDefinition } from '../../types/skill';
import type { ScheduleStatus } from '../../types/schedule';
import { Icon } from '../icons';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type SkillView = {
  skill: SkillDefinition;
  progress: SkillProgressView;
};

type EducationProgramView = {
  program: EducationProgram;
  skill?: SkillDefinition;
  location?: Location;
  canStudy: boolean;
  failure?: string;
  scheduleStatus: ScheduleStatus;
  effectiveNeedsDelta: Partial<NeedsState>;
};

type DevelopmentPanelProps = {
  skills: SkillView[];
  programs: EducationProgramView[];
  onStudyProgram: (programId: EducationProgramId) => void;
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return `${hours} ч ${rest} мин`;
  if (hours > 0) return `${hours} ч`;
  return `${rest} мин`;
}

function getProgramEffects(program: EducationProgram, effectiveNeedsDelta: Partial<NeedsState>): EffectListItem[] {
  return [
    { label: 'Навык', value: program.experienceReward, unit: 'XP', tone: 'positive' },
    ...(program.price > 0 ? [{ label: 'Деньги', value: -program.price, unit: '₽', tone: 'negative' } as EffectListItem] : []),
    { label: 'Время', value: -program.durationMinutes, unit: 'мин', tone: 'negative' },
    ...createNeedsEffectItems(effectiveNeedsDelta)
  ];
}

function SkillCard({ view }: { view: SkillView }) {
  const { skill, progress } = view;

  return (
    <article className="skill-card interactive-surface">
      <div className="skill-card__header">
        <span className="skill-card__icon"><Icon name={skill.category === 'physical' ? 'gym' : 'growth'} size={19} /></span>
        <div>
          <span>{skill.category === 'physical' ? 'Физический навык' : 'Профессиональный навык'}</span>
          <strong>{skill.name}</strong>
        </div>
        <b>{progress.level}/{skill.maxLevel}</b>
      </div>
      <div className="skill-card__progress" aria-label={`Прогресс навыка ${skill.name}`}>
        <span style={{ width: `${progress.progressPercent}%` }} />
      </div>
      <div className="skill-card__footer">
        <span>{progress.isMaxLevel ? 'Максимальный уровень' : `${progress.experience} / ${progress.experienceRequired} XP`}</span>
        <strong>{progress.isMaxLevel ? 'MAX' : `Осталось ${progress.experienceRemaining}`}</strong>
      </div>
    </article>
  );
}

function ProgramRow({ view, onStudyProgram }: { view: EducationProgramView; onStudyProgram: (programId: EducationProgramId) => void }) {
  const { program, skill, location, canStudy, failure, effectiveNeedsDelta, scheduleStatus } = view;

  return (
    <article className={canStudy ? 'education-row education-row--available' : 'education-row'}>
      <span className="education-row__icon"><Icon name={program.mode === 'self_study' ? 'home' : 'book'} size={20} /></span>
      <div className="education-row__body">
        <div className="education-row__title">
          <strong>{program.title}</strong>
          <span>{program.mode === 'self_study' ? 'Самообучение' : 'Курс'}</span>
        </div>
        <div className="education-row__meta">
          <span>{skill?.name ?? 'Навык'}</span>
          <span>{formatDuration(program.durationMinutes)}</span>
          <span>{program.price === 0 ? 'Бесплатно' : formatRubles(program.price)}</span>
          <span>{location?.name ?? 'Локация'}</span>
          <span className={scheduleStatus.isOpen ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>{scheduleStatus.label}</span>
        </div>
        <EffectList items={getProgramEffects(program, effectiveNeedsDelta)} />
        {!canStudy && failure ? <small className="education-row__failure">{failure}</small> : null}
      </div>
      <button
        className="row-action-button"
        disabled={!canStudy}
        type="button"
        onClick={() => onStudyProgram(program.id)}
      >
        Начать
      </button>
    </article>
  );
}

export function DevelopmentPanel({ skills, programs, onStudyProgram }: DevelopmentPanelProps) {
  const selfStudy = programs.filter((view) => view.program.mode === 'self_study');
  const courses = programs.filter((view) => view.program.mode === 'course');
  const totalLevels = skills.reduce((sum, view) => sum + view.progress.level, 0);

  return (
    <section className="development-screen">
      <section className="development-hero visual-panel">
        <div className="development-hero__grid" aria-hidden="true" />
        <div className="development-hero__content">
          <span className="section-kicker">Развитие персонажа</span>
          <h2>Навыки и обучение</h2>
          <div className="development-hero__stats">
            <div><span>Навыков</span><strong>{skills.length}</strong></div>
            <div><span>Суммарный уровень</span><strong>{totalLevels}</strong></div>
            <div><span>Программ</span><strong>{programs.length}</strong></div>
          </div>
        </div>
        <div className="development-hero__mark"><Icon name="growth" size={54} /></div>
      </section>

      <section className="panel skill-overview-panel visual-panel">
        <div className="section-heading">
          <div><span className="section-kicker">Профиль</span><h2>Навыки</h2></div>
          <span className="section-counter">{skills.length}</span>
        </div>
        <div className="skills-grid">
          {skills.map((view) => <SkillCard key={view.skill.id} view={view} />)}
        </div>
      </section>

      <section className="panel education-panel visual-panel">
        <div className="section-heading section-heading--compact">
          <div><span className="section-kicker">Дом</span><h2>Самообучение</h2></div>
          <span className="section-counter">{selfStudy.length}</span>
        </div>
        <div className="education-list">
          {selfStudy.map((view) => <ProgramRow key={view.program.id} view={view} onStudyProgram={onStudyProgram} />)}
        </div>
      </section>

      <section className="panel education-panel visual-panel">
        <div className="section-heading section-heading--compact">
          <div><span className="section-kicker">Образовательный центр</span><h2>Курсы</h2></div>
          <span className="section-counter">{courses.length}</span>
        </div>
        <div className="education-list">
          {courses.map((view) => <ProgramRow key={view.program.id} view={view} onStudyProgram={onStudyProgram} />)}
        </div>
      </section>
    </section>
  );
}
