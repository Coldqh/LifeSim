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
  onTakeExam: () => void;
}) {
  const university = props.state.university;
  const enrollment = university.enrollment;

  if (enrollment && university.activeProgram && university.activeUniversity) {
    const subjectRows = university.activeProgram.subjectIds.map((subjectId) => {
      const progress = enrollment.subjectProgress[subjectId];
      const subject = university.classes.find((entry) => entry.subject.id === subjectId)?.subject;
      return { subjectId, title: subject?.title ?? String(subjectId), progress };
    });
    return (
      <div className="phone-app-page phone-screen-enter">
        <div className="phone-app-banner phone-app-banner--education">
          <Icon name="book" size={26}/>
          <div><strong>{university.activeUniversity.shortName}</strong><small>{university.activeProgram.title}</small></div>
        </div>
        <section className="phone-study-overview">
          <div><span>Семестр</span><strong>{enrollment.semester}/{university.activeProgram.durationSemesters}</strong></div>
          <div><span>Нагрузка</span><strong>{Math.round(enrollment.studyLoad)}%</strong></div>
          <div><span>Экзамены</span><strong>{enrollment.examsPassed}</strong></div>
          <div><span>Кампус</span><strong>{university.campusPeople.length} человек</strong></div>
        </section>
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Ближайшие пары</span><em>{university.classes.length}</em></div>
          <div className="phone-study-list">
            {university.classes.length ? university.classes.map((entry) => (
              <article className="phone-study-row" key={entry.sessionKey}>
                <div><strong>{entry.subject.title}</strong><small>{formatTotalMinutes(entry.startsAtTotalMinutes)}</small></div>
                <button type="button" disabled={!entry.canAttend} onClick={() => props.onAttendClass(entry.subject.id, entry.startsAtTotalMinutes)}>Посетить</button>
                {entry.failure ? <small className="phone-inline-error">{entry.failure}</small> : null}
              </article>
            )) : <div className="phone-empty-state">Ближайших пар нет</div>}
          </div>
          <button className="phone-secondary-action" type="button" onClick={() => props.onRoute(university.activeUniversity!.locationId)}><Icon name="pin" size={17}/>Маршрут в кампус</button>
        </section>
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Задания</span><em>{university.assignments.filter((entry) => !entry.completed && !entry.missed).length}</em></div>
          <div className="phone-study-list">
            {university.assignments.length ? university.assignments.map((assignment) => (
              <article className="phone-study-row" key={assignment.id}>
                <div><strong>{assignment.title}</strong><small>Срок: день {assignment.dueDay} · {assignment.completed ? 'сдано' : assignment.missed ? 'просрочено' : `${assignment.durationMinutes} мин`}</small></div>
                {!assignment.completed && !assignment.missed ? <button type="button" onClick={() => props.onCompleteAssignment(assignment.id)}>Выполнить</button> : null}
              </article>
            )) : <div className="phone-empty-state">Заданий пока нет</div>}
          </div>
        </section>
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Успеваемость</span><em>{subjectRows.length} предмета</em></div>
          <div className="phone-requirements-list">
            {subjectRows.map((row) => (
              <div key={String(row.subjectId)}><span>{row.title}</span><strong>{row.progress?.knowledge ?? 0}% · {row.progress?.classesAttended ?? 0} пар</strong></div>
            ))}
          </div>
          <button className="phone-primary-action" type="button" onClick={props.onTakeExam}>Сдать семестровый экзамен</button>
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

