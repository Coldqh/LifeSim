import { applyMoneyDelta } from '../../core/economy';
import { reconcileExternalBankBalance } from '../../core/finance';
import { applyIntercityCarTravel, bookIntercityTicket, bookTemporaryAccommodation, getIntercityCarQuote, useIntercityTicket } from '../../core/intercity';
import { getCityById, getDefaultArrivalLocationForCity, getLocationById } from '../../core/location';
import { applyNeedsDelta } from '../../core/needs';
import { addMinutes, getTotalMinutes } from '../../core/time';
import { getVehicleModelById } from '../../data/vehicles/vehicleModels';
import { getIntercityRoadConnection, getIntercityRouteById, getTemporaryAccommodationById } from '../../data/intercity/routes';
import type { CityId, PhoneNotificationId, PhoneCalendarEventId, IntercityRouteId, IntercityTicketId, TemporaryAccommodationId } from '../../types/ids';
import type { VehicleWorldState } from '../../types/vehicle';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createIntercityCommands(setGameState: GameStateSetter) {
  function buyIntercityTicketAction(routeId: IntercityRouteId, departureTotalMinutes: number): void {
    setGameState((currentState) => {
      const route = getIntercityRouteById(routeId);
      if (!route) return currentState;
      const applied = bookIntercityTicket({
        state: currentState.world.intercity,
        route,
        departureTotalMinutes,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        bankBalance: currentState.player.money
      });
      if (!applied.result.ok || !applied.ticket) {
        return {
          ...currentState,
          lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] }
        };
      }

      const nextPlayer = { ...currentState.player, money: applyMoneyDelta(currentState.player.money, applied.result.moneyDelta ?? 0) };
      const finance = reconcileExternalBankBalance({
        state: currentState.world.finance,
        bankBalance: nextPlayer.money,
        totalMinutes: getTotalMinutes(currentState.time),
        actionTitle: `Билет: ${route.title}`
      });
      const calendarId = (`calendar_trip_${String(applied.ticket.id)}`) as PhoneCalendarEventId;
      const notificationId = (`notification_trip_${String(applied.ticket.id)}`) as PhoneNotificationId;
      const phone = {
        ...currentState.world.phone,
        calendarEvents: [{
          id: calendarId,
          type: 'intercity_departure' as const,
          title: `${route.mode === 'train' ? 'Поезд' : 'Автобус'}: ${route.title}`,
          locationId: route.originTerminalLocationId,
          startsAtTotalMinutes: applied.ticket.departureTotalMinutes,
          durationMinutes: route.durationMinutes,
          status: 'scheduled' as const,
          intercityRouteId: route.id,
          intercityTicketId: applied.ticket.id
        }, ...currentState.world.phone.calendarEvents].slice(0, 60),
        notifications: [{
          id: notificationId,
          appId: 'trips' as const,
          title: 'Билет куплен',
          body: route.title,
          createdAtTotalMinutes: getTotalMinutes(currentState.time),
          read: false,
          locationId: route.originTerminalLocationId,
          intercityRouteId: route.id,
          intercityTicketId: applied.ticket.id
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      const logEntry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
      return {
        ...currentState,
        player: nextPlayer,
        world: { ...currentState.world, intercity: applied.state, phone, finance },
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: 0, moneyDelta: applied.result.moneyDelta, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function boardIntercityTicketAction(ticketId: IntercityTicketId): void {
    setGameState((currentState) => {
      const ticket = currentState.world.intercity.tickets.find((entry) => entry.id === ticketId);
      const route = getIntercityRouteById(ticket?.routeId);
      const applied = useIntercityTicket({
        state: currentState.world.intercity,
        ticket,
        route,
        currentLocationId: currentState.player.locationId,
        currentTotalMinutes: getTotalMinutes(currentState.time)
      });
      if (!applied.result.ok || !route) {
        return { ...currentState, lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] } };
      }
      const destination = getLocationById(route.destinationTerminalLocationId);
      if (!destination) return currentState;
      const nextTime = addMinutes(currentState.time, applied.result.timeDeltaMinutes);
      const movedPlayer = {
        ...currentState.player,
        cityId: destination.cityId,
        districtId: destination.districtId,
        locationId: destination.id,
        needs: applyNeedsDelta(currentState.player.needs, applied.result.needsDelta)
      };
      const notificationId = (`notification_trip_arrived_${String(ticketId)}`) as PhoneNotificationId;
      const phone = {
        ...currentState.world.phone,
        calendarEvents: currentState.world.phone.calendarEvents.map((event) => event.intercityTicketId === ticketId
          ? { ...event, status: 'completed' as const }
          : event),
        notifications: [{
          id: notificationId,
          appId: 'trips' as const,
          title: 'Прибытие',
          body: `${getCityById(destination.cityId)?.name ?? 'Другой город'} · ${destination.name}`,
          createdAtTotalMinutes: getTotalMinutes(nextTime),
          read: false,
          locationId: destination.id,
          intercityRouteId: route.id,
          intercityTicketId: ticketId
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        movedPlayer,
        nextTime,
        'resting',
        { intercity: applied.state, phone, actionTitle: applied.result.title }
      );
      const messages = [applied.result.message, ...elapsedApplied.messages];
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: applied.result.title,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          locationDelta: destination.id,
          messages
        },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: nextTime }, applied.result.title, messages.join(' ')), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function bookTemporaryAccommodationAction(accommodationId: TemporaryAccommodationId, nights: number): void {
    setGameState((currentState) => {
      const accommodation = getTemporaryAccommodationById(accommodationId);
      if (!accommodation) return currentState;
      const applied = bookTemporaryAccommodation({
        state: currentState.world.intercity,
        accommodation,
        currentCityId: currentState.player.cityId,
        currentDay: currentState.time.day,
        nights,
        bankBalance: currentState.player.money
      });
      if (!applied.result.ok) {
        return { ...currentState, lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] } };
      }
      const player = { ...currentState.player, money: applyMoneyDelta(currentState.player.money, applied.result.moneyDelta ?? 0) };
      const finance = reconcileExternalBankBalance({
        state: currentState.world.finance,
        bankBalance: player.money,
        totalMinutes: getTotalMinutes(currentState.time),
        actionTitle: `Гостиница: ${accommodation.name}`
      });
      const notificationId = (`notification_stay_${String(accommodation.id)}_${currentState.time.day}`) as PhoneNotificationId;
      const phone = {
        ...currentState.world.phone,
        notifications: [{
          id: notificationId,
          appId: 'trips' as const,
          title: 'Проживание подтверждено',
          body: `${accommodation.name} · до дня ${applied.state.activeStay?.checkoutDay ?? currentState.time.day + nights}`,
          createdAtTotalMinutes: getTotalMinutes(currentState.time),
          read: false,
          locationId: accommodation.locationId
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      return {
        ...currentState,
        player,
        world: { ...currentState.world, intercity: applied.state, finance, phone },
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: 0, moneyDelta: applied.result.moneyDelta, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([createLifeLogEntry(currentState, applied.result.title, applied.result.message)], currentState.lifeLog)
      };
    });
  }

  function driveIntercityAction(destinationCityId: CityId): void {
    setGameState((currentState) => {
      if (destinationCityId === currentState.player.cityId) return currentState;
      const connection = getIntercityRoadConnection(currentState.player.cityId, destinationCityId);
      const model = getVehicleModelById(currentState.world.vehicles.ownedVehicle?.modelId);
      const quote = getIntercityCarQuote({
        connection,
        world: currentState.world.vehicles,
        model,
        currentLocationId: currentState.player.locationId
      });
      if (currentState.player.money < quote.roadCost) {
        return { ...currentState, lastResult: { ok: false, actionName: 'Междугородняя поездка', timeDeltaMinutes: 0, messages: ['Не хватает денег на дорожные расходы.'] } };
      }
      const applied = applyIntercityCarTravel({
        state: currentState.world.intercity,
        originCityId: currentState.player.cityId,
        destinationCityId,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        quote
      });
      if (!applied.result.ok || !currentState.world.vehicles.ownedVehicle) {
        return { ...currentState, lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] } };
      }
      const destination = getDefaultArrivalLocationForCity(destinationCityId);
      if (!destination) {
        return { ...currentState, lastResult: { ok: false, actionName: 'Междугородняя поездка', timeDeltaMinutes: 0, messages: ['Для города не настроена точка прибытия.'] } };
      }
      const nextTime = addMinutes(currentState.time, quote.durationMinutes);
      const chargedPlayer = {
        ...currentState.player,
        money: applyMoneyDelta(currentState.player.money, -quote.roadCost),
        cityId: destination.cityId,
        districtId: destination.districtId,
        locationId: destination.id,
        needs: applyNeedsDelta(currentState.player.needs, applied.result.needsDelta)
      };
      const owned = currentState.world.vehicles.ownedVehicle;
      const vehicles: VehicleWorldState = {
        ...currentState.world.vehicles,
        ownedVehicle: {
          ...owned,
          fuelLiters: Math.max(0, owned.fuelLiters - quote.fuelLiters),
          odometerKm: owned.odometerKm + quote.distanceKm,
          conditionPercent: Math.max(0, owned.conditionPercent - 2),
          reliabilityPercent: Math.max(0, owned.reliabilityPercent - (owned.odometerKm + quote.distanceKm >= owned.nextServiceOdometerKm ? 2 : 1)),
          parkedLocationId: destination.id
        }
      };
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        chargedPlayer,
        nextTime,
        'active',
        {
          intercity: applied.state,
          vehicles,
          actionTitle: 'Междугородняя поездка на автомобиле'
        }
      );
      const messages = [applied.result.message, ...elapsedApplied.messages];
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: applied.result.title,
          timeDeltaMinutes: quote.durationMinutes,
          moneyDelta: -quote.roadCost,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          locationDelta: destination.id,
          messages
        },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: nextTime }, applied.result.title, messages.join(' ')), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    buyIntercityTicketAction,
    boardIntercityTicketAction,
    bookTemporaryAccommodationAction,
    driveIntercityAction
  };
}
