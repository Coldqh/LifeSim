import { useMemo, useState } from 'react';
import type { Job } from '../../../types/job';
import type { City, District, Location } from '../../../types/location';
import type {
  CityId,
  DistrictId,
  JobId,
  LocationId,
  MedicalServiceId,
  PhoneMessageId,
  PhoneNotificationId,
  VehicleListingId,
  VehicleModelId,
  IntercityRouteId,
  IntercityTicketId,
  TemporaryAccommodationId,
  DegreeProgramId,
  UniversityCampusActivityId,
  UniversitySubjectId,
  NpcId,
  SocialInvitationId,
  SocialMeetingId,
  SocialMeetingTypeId
} from '../../../types/ids';
import type { PhoneAppId, PhoneJobApplication, PhoneMessage, PhoneState } from '../../../types/phone';
import type { GameTime } from '../../../types/time';
import type { DistrictTravelOption, LocationTravelOption } from '../../../types/travel';
import type { PersonalFinanceState, UpcomingPayment } from '../../../types/finance';
import type { TravelModeId } from '../../../types/transport';
import type { VehicleListingView, VehicleModel, VehicleWorldState } from '../../../types/vehicle';
import type { ActiveMedicalCondition, MedicalAppointment, MedicalConditionDefinition, MedicalPrescription, MedicalService, MedicalState, SickLeave } from '../../../types/healthcare';
import type { Product } from '../../../types/product';
import type { IntercityCarQuote, IntercityDeparture, IntercityRoadConnection, IntercityRoute, IntercityTicket, IntercityTravelState, TemporaryAccommodation, TemporaryStay } from '../../../types/intercity';
import type { ScheduleStatus } from '../../../types/schedule';
import type { DegreeProgramDefinition, UniversityApplication, UniversityAssignment, UniversityClassView, UniversityDefinition, UniversityEnrollment, UniversityState } from '../../../types/university';
import type { Npc, NpcRoleDefinition } from '../../../types/npc';
import type { NpcRelationship, RelationshipStatus } from '../../../types/relationship';
import type { SocialContact, SocialCircleTag, SocialInvitation, SocialMeeting, SocialMeetingDefinition, SocialMeetingSlot, SocialMessageActionId, SocialQuickMessageDefinition } from '../../../types/socialLife';
import { VEHICLE_DEFECT_LABELS } from '../../../core/vehicles';
import { formatGameTime } from '../../../core/time';
import { getRelationshipStatusLabel } from '../../../core/relationships';
import { Icon } from '../../icons';
import type { PhonePanelState } from '../phoneTypes';
import { APPLICATION_LABELS, formatRubles, formatTotalMinutes, getApplicationTone } from '../phoneShared';

export default function EducationApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onSubmit: (programId: DegreeProgramId) => void;
  onAttendEntrance: (programId: DegreeProgramId) => void;
  onEnroll: (programId: DegreeProgramId) => void;
  onAttendClass: (subjectId: UniversitySubjectId, startsAtTotalMinutes: number) => void;
  onCompleteAssignment: (assignmentId: string) => void;
  onCampusActivity: (activityId: UniversityCampusActivityId) => void;
  onTakeExam: () => void;
}) {
  const university = props.state.university;
  const enrollment = university.enrollment;

  if (enrollment && university.activeProgram && university.activeUniversity) {
    const semesterSummary = university.semesterSummary;
    const visibleAssignments = university.assignments.filter((assignment) => !assignment.completed);
    const examRequirementsMet = Boolean(semesterSummary?.examRequirementsMet);
    const examStatus = examRequirementsMet
      ? university.semesterExamFailure === 'Нужно приехать в университет.'
        ? 'Допуск получен'
        : 'Можно сдавать'
      : 'Нет допуска';

    return (
      <div className="phone-app-page phone-screen-enter phone-education-dashboard">
        <div className="phone-app-banner phone-app-banner--education">
          <Icon name="book" size={26}/>
          <div><strong>{university.activeUniversity.shortName}</strong><small>{university.activeProgram.title}</small></div>
        </div>

        <section className="phone-study-overview phone-study-overview--semester">
          <div><span>Семестр</span><strong>{enrollment.semester}/{university.activeProgram.durationSemesters}</strong></div>
          <div><span>Посещаемость</span><strong>{semesterSummary?.attendanceRate ?? 100}%</strong></div>
          <div className={(semesterSummary?.academicDebtCount ?? 0) > 0 ? 'is-warning' : ''}><span>Долги</span><strong>{semesterSummary?.academicDebtCount ?? 0}</strong></div>
          <div><span>Нагрузка</span><strong>{Math.round(enrollment.studyLoad)}%</strong></div>
        </section>

        <section className={`phone-semester-status ${examRequirementsMet ? 'is-ready' : 'is-warning'}`}>
          <div>
            <span>Статус семестра</span>
            <strong>{examStatus}</strong>
            <small>
              Средние знания {semesterSummary?.averageKnowledge ?? 0}%
              {semesterSummary?.examPenaltyPoints ? ` · штраф за пропуски −${semesterSummary.examPenaltyPoints}` : ' · без штрафа за пропуски'}
            </small>
          </div>
          <em>{semesterSummary?.subjectsAtRisk ?? 0} в риске</em>
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Расписание</span><em>{university.classes.length} пар</em></div>
          <div className="phone-study-list phone-study-list--schedule">
            {university.classes.length ? university.classes.map((entry) => (
              <article className={`phone-study-row phone-study-row--class ${entry.canAttend ? 'is-live' : ''}`} key={entry.sessionKey}>
                <div>
                  <span className="phone-study-row__status">{entry.canAttend ? 'Можно войти' : entry.isToday ? 'Сегодня' : 'Предстоящая'}</span>
                  <strong>{entry.subject.title}</strong>
                  <small>{formatTotalMinutes(entry.startsAtTotalMinutes)} · {entry.subject.durationMinutes} мин</small>
                </div>
                {entry.canAttend ? <button type="button" onClick={() => props.onAttendClass(entry.subject.id, entry.startsAtTotalMinutes)}>Посетить</button> : null}
                {entry.isToday && entry.failure ? <small className="phone-inline-error">{entry.failure}</small> : null}
              </article>
            )) : <div className="phone-empty-state">Ближайших пар нет</div>}
          </div>
          <button className="phone-secondary-action phone-campus-route" type="button" onClick={() => props.onRoute(university.activeUniversity!.locationId)}><Icon name="pin" size={17}/>Маршрут в кампус</button>
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Предметы</span><em>{semesterSummary?.subjects.length ?? 0}</em></div>
          <div className="phone-subject-progress-list">
            {semesterSummary?.subjects.map((subject) => (
              <article className={subject.readyForExam ? 'is-ready' : 'is-pending'} key={String(subject.subjectId)}>
                <div>
                  <strong>{subject.title}</strong>
                  <small>Знания {subject.knowledge}% · пропуски {subject.classesMissed}</small>
                </div>
                <div className="phone-subject-progress-list__requirements">
                  <span className={subject.classesAttended >= 2 ? 'is-complete' : ''}>Пары {subject.classesAttended}/2</span>
                  <span className={subject.assignmentsCompleted >= 1 ? 'is-complete' : ''}>Задания {subject.assignmentsCompleted}/1</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Задания</span><em>{semesterSummary?.activeAssignments ?? 0} активных</em></div>
          <div className="phone-study-list">
            {visibleAssignments.length ? visibleAssignments.map((assignment) => (
              <article className={`phone-study-row ${assignment.missed ? 'is-overdue' : ''}`} key={assignment.id}>
                <div>
                  <strong>{assignment.title}</strong>
                  <small>{assignment.missed ? 'Просрочено' : `Срок: день ${assignment.dueDay} · ${assignment.durationMinutes} мин`}</small>
                </div>
                {!assignment.missed ? <button type="button" onClick={() => props.onCompleteAssignment(assignment.id)}>Выполнить</button> : null}
              </article>
            )) : <div className="phone-empty-state">Активных заданий нет</div>}
          </div>
          {(semesterSummary?.completedAssignments ?? 0) > 0 ? <small className="phone-study-footnote">Сдано заданий: {semesterSummary?.completedAssignments}</small> : null}
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Жизнь в кампусе</span><em>{university.campusActivities.length}</em></div>
          <div className="phone-study-list">
            {university.campusActivities.map(({ activity, failure }) => (
              <article className="phone-study-row phone-study-row--campus" key={activity.id}>
                <div>
                  <strong>{activity.title}</strong>
                  <small>{activity.description}</small>
                  <small>{activity.durationMinutes} мин · {activity.moneyCost ? formatRubles(activity.moneyCost) : 'бесплатно'}{activity.knowledgeReward ? ` · знания +${activity.knowledgeReward}` : ''}</small>
                </div>
                <button type="button" disabled={Boolean(failure)} onClick={() => props.onCampusActivity(activity.id)}>Начать</button>
                {failure ? <small className="phone-inline-error">{failure}</small> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="phone-subsection phone-exam-panel">
          <div className="phone-section-title"><span>Семестровый экзамен</span><em>{examStatus}</em></div>
          <p>Для допуска по каждому предмету нужны две посещённые пары и одно сданное задание.</p>
          <button className="phone-primary-action" type="button" disabled={Boolean(university.semesterExamFailure)} onClick={props.onTakeExam}>Сдать экзамен</button>
          {university.semesterExamFailure ? <small className="phone-inline-error">{university.semesterExamFailure}</small> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--education"><Icon name="book" size={26}/><div><strong>Образование</strong><small>Реальные университеты Москвы и Ярославля</small></div></div>
      <div className="phone-university-list">
        {university.programs.map((view) => {
          const status = view.application?.status;
          return (
            <article className="phone-university-card" key={view.program.id}>
              <span>{view.university?.shortName ?? 'Университет'}</span>
              <h3>{view.program.title}</h3>
              <p>{view.university?.address}</p>
              <div className="phone-detail-grid">
                <div><span>Семестр</span><strong>{formatRubles(view.program.tuitionPerSemester)}</strong></div>
                <div><span>Срок</span><strong>{view.program.durationSemesters} семестров</strong></div>
              </div>
              <div className="phone-tag-row">{view.program.careerTags.map((tag) => <em key={tag}>{tag}</em>)}</div>
              {view.missingSkillRequirements.length ? <small className="phone-inline-error">Не хватает: {view.missingSkillRequirements.map((entry) => `${entry.name} ${entry.currentLevel}/${entry.minLevel}`).join(', ')}</small> : null}
              {status ? <div className={`phone-application-status phone-application-status--${status === 'passed' || status === 'enrolled' ? 'positive' : status === 'failed' ? 'negative' : 'neutral'}`}><span>{status === 'exam_scheduled' ? 'Испытание назначено' : status === 'passed' ? 'Испытание сдано' : status === 'failed' ? 'Не сдано' : status === 'enrolled' ? 'Зачислен' : 'Заявка'}</span>{view.application?.score !== undefined ? <strong>{view.application.score} баллов</strong> : null}</div> : null}
              <div className="phone-sticky-actions phone-sticky-actions--inline">
                {view.university ? <button className="phone-secondary-action" type="button" onClick={() => props.onRoute(view.university!.locationId)}><Icon name="pin" size={16}/>Маршрут</button> : null}
                {(!status || status === 'failed') ? <button className="phone-primary-action" type="button" disabled={!view.canApply} onClick={() => props.onSubmit(view.program.id)}>{status === 'failed' ? 'Подать повторно' : 'Подать заявление'}</button> : null}
                {status === 'exam_scheduled' ? <button className="phone-primary-action" type="button" disabled={Boolean(view.examFailure)} onClick={() => props.onAttendEntrance(view.program.id)}>Сдать испытание</button> : null}
                {status === 'passed' ? <button className="phone-primary-action" type="button" disabled={!view.canEnroll} onClick={() => props.onEnroll(view.program.id)}>Зачислиться</button> : null}
              </div>
              {status === 'exam_scheduled' && view.examFailure ? <small className="phone-inline-error">{view.examFailure}</small> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

