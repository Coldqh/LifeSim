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
import type { PhonePanelState, PhoneShellProps } from '../phoneTypes';
import { APPLICATION_LABELS, formatRubles, formatTotalMinutes, getApplicationTone } from '../phoneShared';

export default function BankApp(props: {
  state: PhonePanelState;
  onTransfer: PhoneShellProps['onTransferFunds'];
  onSetAutoSave: PhoneShellProps['onSetAutoSave'];
  onCreateGoal: PhoneShellProps['onCreateSavingsGoal'];
  onFundGoal: PhoneShellProps['onFundSavingsGoal'];
}) {
  const [amount, setAmount] = useState(1000);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(50000);
  const finance = props.state.finance;
  return (
    <div className="phone-app-page phone-screen-enter phone-bank-app">
      <div className="phone-bank-card"><span>LifeBank · дебетовая</span><strong>{formatRubles(finance.bankBalance)}</strong><small>Доступно на счёте</small><i>•• 1842</i></div>
      <div className="phone-balance-grid">
        <div><span>Наличные</span><strong>{formatRubles(finance.finance.cash)}</strong></div>
        <div><span>Накопления</span><strong>{formatRubles(finance.finance.savings)}</strong></div>
        <div><span>Начислено</span><strong>{formatRubles(finance.finance.pendingSalary)}</strong></div>
        <div><span>Долги</span><strong className={finance.totalDebt > 0 ? 'negative' : ''}>{formatRubles(finance.totalDebt)}</strong></div>
      </div>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Переводы</span><em>{formatRubles(amount)}</em></div>
        <input className="phone-money-input" type="number" min="100" step="100" value={amount} onChange={(event) => setAmount(Number(event.target.value) || 100)}/>
        <div className="phone-transfer-grid">
          <button type="button" onClick={() => props.onTransfer('bank_to_cash', amount)}>Снять</button>
          <button type="button" onClick={() => props.onTransfer('cash_to_bank', amount)}>Внести</button>
          <button type="button" onClick={() => props.onTransfer('bank_to_savings', amount)}>В накопления</button>
          <button type="button" onClick={() => props.onTransfer('savings_to_bank', amount)}>Из накоплений</button>
        </div>
      </section>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Автосбережение с зарплаты</span><em>{finance.finance.autoSavePercent}%</em></div>
        <div className="phone-autosave-row">{[0,5,10,20,30].map((value) => <button className={finance.finance.autoSavePercent === value ? 'active' : ''} key={value} type="button" onClick={() => props.onSetAutoSave(value)}>{value}%</button>)}</div>
        <p className="phone-muted">Следующая выплата: день {finance.finance.nextSalaryPayoutDay}</p>
      </section>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Цели</span><em>{finance.finance.goals.length}/5</em></div>
        <div className="phone-goal-create"><input placeholder="Например, новая квартира" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)}/><input type="number" min="1000" step="1000" value={goalTarget} onChange={(event) => setGoalTarget(Number(event.target.value) || 1000)}/><button type="button" onClick={() => { props.onCreateGoal(goalTitle, goalTarget); setGoalTitle(''); }}>Создать</button></div>
        <div className="phone-goal-list">{finance.finance.goals.map((goal) => { const percent = Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)); return <article key={goal.id}><div><strong>{goal.title}</strong><span>{formatRubles(goal.currentAmount)} / {formatRubles(goal.targetAmount)}</span></div><i><b style={{width:`${percent}%`}}/></i><button type="button" onClick={() => props.onFundGoal(goal.id, amount)}>+ {formatRubles(amount)}</button></article>; })}</div>
      </section>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Ближайшие платежи</span><em>{finance.upcomingPayments.length}</em></div>
        <div className="phone-payment-list">{finance.upcomingPayments.map((payment) => <div key={payment.id}><span><strong>{payment.title}</strong><small>День {payment.dueDay}</small></span><b>-{formatRubles(payment.amount)}</b></div>)}</div>
      </section>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>История</span><em>{finance.finance.transactions.length}</em></div>
        <div className="phone-transaction-list">{finance.finance.transactions.length ? finance.finance.transactions.slice(0,20).map((transaction) => <div key={transaction.id}><span><strong>{transaction.title}</strong><small>{formatTotalMinutes(transaction.totalMinutes)}</small></span><b className={transaction.amount >= 0 ? 'positive' : 'negative'}>{transaction.amount >= 0 ? '+' : ''}{formatRubles(transaction.amount)}</b></div>) : <p className="phone-muted">Операций пока нет.</p>}</div>
      </section>
    </div>
  );
}


