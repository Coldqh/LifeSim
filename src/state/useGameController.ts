import { useEffect, useMemo, useState } from 'react';
import { getCareerApplicationFailure, getCareerResume } from '../core/career';
import { getBusinessHireCandidates, getBusinessLaunchFailure, getBusinessStartupCost, isBusinessEmployeeOnShift } from '../core/business';
import { getHousingAffordability, isHousingViewed, scheduleHousingViewing } from '../core/housing';
import { canAfford } from '../core/economy';
import { getEducationProgramFailure } from '../core/education';
import { getJobApplicationFailure, getJobProgress, getJobPromotionFailure, getJobShiftFailure } from '../core/jobs';
import { getMedicalActivityFailure, getMedicalAppointmentFailure } from '../core/healthcare';
import { bookTemporaryAccommodation, getTemporaryStayFailure } from '../core/intercity';
import { getMissingSkillRequirements, getSkillProgress } from '../core/progression';
import { getActionsForLocation, getCityById, getDefaultLocationForDistrict, getDistrictById, getDistrictsForCity, getLocationById, getLocationsForDistrict } from '../core/location';
import { adjustActivityNeedsDelta, getNeedConditions, getNeedsConsequences, getNeedsRequirementFailure } from '../core/needs';
import { getShopForLocation, getShopProducts } from '../core/shop';
import { getScheduleActivityFailure, getScheduleStatus } from '../core/schedule';
import { getInterviewFailure, getJobApplicationForJob, getPhoneUnreadCount } from '../core/phone';
import { getLocationPopulationPresence, getPopulationSummary } from '../core/population';
import { getInteractionFailure, getNpcRelationship, getRelationshipStatus } from '../core/relationships';
import { getContactExchangeFailure, getNpcSocialCircles, getSocialMeetingFailure, getSocialQuickMessageFailure } from '../core/social-life';
import { getBoxingFatigueLabel, getBoxingLevelProgress, getBoxingMembershipFailure, getBoxingSparringFailure, getBoxingTournamentFailure, getBoxingTrainerSelectionFailure, getBoxingTrainingFailure, hasActiveBoxingMembership } from '../core/sport';
import { getTotalMinutes } from '../core/time';
import { getEntranceExamFailure, getUniversityApplicationForProgram, getUniversityClasses } from '../core/university';
import { calculateVehicleTravelQuote } from '../core/vehicles';
import { createDistrictTravelOption, createLocationTravelOptions } from '../core/travel';
import { allLocations } from '../data/locations';
import {
  getAllBoxingGyms,
  getAllBoxingTrainers,
  getAllDegreePrograms,
  getAllEducationPrograms,
  getAllJobs,
  getAllMedicalServices,
  getAllUniversitySubjects,
  getBoxingGymById,
  getBoxingGymByLocationId,
  getBoxingTrainerById,
  getBusinessPremisesById,
  getCareerCompanyById,
  getDegreeProgramById,
  getHousingById,
  getJobById,
  getJobsForLocation,
  getUniversityById
} from '../data/cities/contentSelectors';
import { getNpcRoleById } from '../data/population/npcRoles';
import { npcInteractionTemplates } from '../data/social/interactionTemplates';
import { getSocialMeetingType, socialMeetingTypes, socialQuickMessages } from '../data/social/meetingTypes';
import { businessTypes, getBusinessTypeById } from '../data/business/businessTypes';
import { businessEquipment } from '../data/business/equipment';
import { businessSupplies } from '../data/business/supplies';
import { getBusinessMenuItemById } from '../data/business/menu';
import { businessUpgrades } from '../data/business/upgrades';
import { getProductById } from '../data/products/basicProducts';
import { getMedicalConditionDefinition } from '../data/healthcare/conditions';
import { basicSkills, getSkillById } from '../data/skills/basicSkills';
import { boxingTrainings } from '../data/sports/boxingTrainings';
import { boxingOpponents } from '../data/sports/boxingOpponents';
import { boxingTournaments } from '../data/sports/boxingTournaments';
import { getVehicleModelById, newDealerVehicleModels } from '../data/vehicles/vehicleModels';
import { temporaryAccommodations } from '../data/intercity/routes';
import type { UpcomingPayment } from '../types/finance';
import type { Npc } from '../types/npc';
import type { SocialNpcView } from '../types/relationship';
import type { VehicleWorldState } from '../types/vehicle';
import type { DistrictTravelOption, LocationTravelOption, TransportOption } from '../types/travel';
import { createInitialGameState, loadGameState, saveGameState, type GameState } from './gameState';
import { GAS_STATION_LOCATION_IDS, SERVICE_LOCATION_IDS, getDealerLocationIdForModel } from './commands/vehicleCommands';
import { selectIntercityState } from './selectors/intercityState';
import { selectScheduledWaitState } from './selectors/scheduledWaitState';
import { createGameCommands, getNpcSocialContext } from './commands';

const jobsCatalogue = getAllJobs();
const educationProgramsCatalogue = getAllEducationPrograms();
const degreeProgramsCatalogue = getAllDegreePrograms();
const universitySubjectCatalogue = getAllUniversitySubjects();
const medicalServicesCatalogue = getAllMedicalServices();
const boxingGymsCatalogue = getAllBoxingGyms();
const boxingTrainersCatalogue = getAllBoxingTrainers();


function resolveInitialState(): GameState {
  return loadGameState() ?? createInitialGameState();
}


function createPersonalCarTransportOption(input: {
  world: VehicleWorldState;
  fromLocation: ReturnType<typeof getLocationById>;
  toLocation: ReturnType<typeof getLocationById>;
  baseDurationMinutes: number;
}): TransportOption {
  const model = getVehicleModelById(input.world.ownedVehicle?.modelId);
  const quote = calculateVehicleTravelQuote({
    vehicle: input.world.ownedVehicle,
    model,
    fromLocationId: input.fromLocation?.id,
    toLocationId: input.toLocation?.id,
    fromDistrictId: input.fromLocation?.districtId,
    toDistrictId: input.toLocation?.districtId,
    baseDurationMinutes: input.baseDurationMinutes
  });
  return {
    modeId: 'car',
    name: 'Личный автомобиль',
    description: quote.available
      ? `${quote.distanceKm.toFixed(1)} км · топливо ${quote.fuelLiters.toFixed(1)} л · парковка ${quote.parkingCost} ₽`
      : quote.unavailableReason ?? 'Автомобиль недоступен.',
    durationMinutes: quote.durationMinutes,
    moneyCost: quote.parkingCost,
    available: quote.available,
    unavailableReason: quote.unavailableReason
  };
}

function addPersonalCarToLocationOptions(
  options: LocationTravelOption[],
  fromLocation: ReturnType<typeof getLocationById>,
  world: VehicleWorldState
): LocationTravelOption[] {
  return options.map((option) => ({
    ...option,
    transportOptions: [
      ...option.transportOptions,
      createPersonalCarTransportOption({
        world,
        fromLocation,
        toLocation: option.location,
        baseDurationMinutes: option.durationMinutes
      })
    ]
  }));
}

function addPersonalCarToDistrictOptions(
  options: DistrictTravelOption[],
  fromLocation: ReturnType<typeof getLocationById>,
  world: VehicleWorldState
): DistrictTravelOption[] {
  return options.map((option) => ({
    ...option,
    transportOptions: option.defaultLocation
      ? [
          ...option.transportOptions,
          createPersonalCarTransportOption({
            world,
            fromLocation,
            toLocation: option.defaultLocation,
            baseDurationMinutes: option.durationMinutes
          })
        ]
      : option.transportOptions
  }));
}


export function useGameController() {
  const [gameState, setGameState] = useState<GameState>(resolveInitialState);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const {
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
    applyForJob,
    promoteJob,
    workShift,
    resignCurrentJob,
    studyProgram,
    buyBoxingMembership,
    chooseBoxingTrainer,
    performBoxingTraining,
    startBoxingSparring,
    enterBoxingTournament,
    scheduleHousingViewingAction,
    viewHousing,
    rentHousing,
    interactWithNpc,
    exchangeNpcContact,
    sendNpcPhoneMessage,
    inviteNpcToMeeting,
    respondNpcMeetingInvitation,
    attendNpcMeeting,
    cancelNpcMeeting,
    chooseSocialEvent,
    openCoffeeBusiness,
    purchaseBusinessSupply,
    changeBusinessMenuPrice,
    hireBusinessNpc,
    fireBusinessNpc,
    addBusinessFunds,
    purchaseBusinessEquipment,
    purchaseBusinessUpgrade,
    workBusinessOwnerShift,
    submitJobApplication,
    togglePhoneSavedJob,
    setPhoneMapLocation,
    readPhoneNotification,
    readPhoneMessage,
    attendJobInterview,
    scheduleMedicalVisit,
    attendMedicalVisit,
    requestSickLeave,
    scheduleVehicleInspectionAction,
    inspectVehicleAction,
    buyUsedVehicleAction,
    buyNewVehicleAction,
    refuelOwnedVehicle,
    serviceOwnedVehicle,
    sellOwnedVehicleAction,
    buyIntercityTicketAction,
    boardIntercityTicketAction,
    bookTemporaryAccommodationAction,
    driveIntercityAction,
    transferPersonalFunds,
    updateAutoSave,
    addSavingsGoal,
    addMoneyToSavingsGoal,
    submitDegreeApplication,
    attendDegreeEntranceExam,
    enrollDegreeProgram,
    attendDegreeClass,
    completeDegreeAssignment,
    takeDegreeSemesterExam,
    skipGameTime,
    resetGame
  } = useMemo(() => createGameCommands(setGameState), []);


  const locationState = useMemo(() => {
    const city = getCityById(gameState.player.cityId);
    const district = getDistrictById(gameState.player.districtId);
    const location = getLocationById(gameState.player.locationId);
    const districts = city ? getDistrictsForCity(city.id) : [];
    const allDistrictLocations = district ? getLocationsForDistrict(district.id) : [];
    const currentHomeLocationId = getHousingById(gameState.player.housingId)?.locationId;
    const locations = allDistrictLocations.filter((candidate) => (
      !candidate.hiddenFromCityBrowser
      || candidate.id === location?.id
      || candidate.id === currentHomeLocationId
    ));
    const actions = getActionsForLocation(location?.id);
    const shop = getShopForLocation(location);
    const shopProducts = getShopProducts(shop?.id);
    const locationScheduleStatus = getScheduleStatus(location?.openingHours, gameState.time);
    const locationScheduleStatuses = Object.fromEntries(
      locations.map((candidateLocation) => [candidateLocation.id, getScheduleStatus(candidateLocation.openingHours, gameState.time)])
    );
    const accommodation = temporaryAccommodations.find((entry) => entry.locationId === location?.id);
    const lodgingFailure = accommodation
      ? getTemporaryStayFailure({ state: gameState.world.intercity, locationId: location?.id, day: gameState.time.day })
      : undefined;
    const actionScheduleFailure = getScheduleActivityFailure(location?.openingHours, gameState.time, 0, 'Действие') ?? lodgingFailure;
    const shopScheduleFailure = shop
      ? getScheduleActivityFailure(location?.openingHours, gameState.time, 0, 'Магазин')
      : undefined;
    const travelContext = {
      playerMoney: gameState.player.money,
      playerNeeds: gameState.player.needs
    };
    const locationTravelOptions = addPersonalCarToLocationOptions(
      createLocationTravelOptions(location, locations, travelContext),
      location,
      gameState.world.vehicles
    );
    const districtTravelOptions = addPersonalCarToDistrictOptions(
      districts.map((candidateDistrict) =>
        createDistrictTravelOption({
          currentLocation: location,
          district: candidateDistrict,
          defaultLocation: getDefaultLocationForDistrict(candidateDistrict.id),
          context: travelContext
        })
      ),
      location,
      gameState.world.vehicles
    );

    return {
      city,
      district,
      location,
      districts,
      locations,
      actions,
      shop,
      shopProducts,
      locationScheduleStatus,
      locationScheduleStatuses,
      actionScheduleFailure,
      shopScheduleFailure,
      locationTravelOptions,
      districtTravelOptions
    };
  }, [gameState.player.cityId, gameState.player.districtId, gameState.player.locationId, gameState.player.money, gameState.player.needs, gameState.time, gameState.world.vehicles, gameState.world.intercity]);

  const jobState = useMemo(() => {
    const currentJob = getJobById(gameState.player.currentJobId);

    function buildJobView(job: import('../types/job').Job) {
      const location = getLocationById(job.locationId);
      const district = location ? getDistrictById(location.districtId) : undefined;
      const applicationFailure = getJobApplicationFailure(gameState.player, job)
        ?? getCareerApplicationFailure(gameState.player, job, 'direct');
      const shiftFailure = getMedicalActivityFailure(gameState.world.medical, 'work')
        ?? getJobShiftFailure(gameState.player, job, gameState.time);
      const promotionFailure = getJobPromotionFailure(gameState.player, job);
      const progress = getJobProgress(gameState.player, job);
      const missingSkillRequirements = getMissingSkillRequirements(gameState.player, job.requirements?.skills).map((requirement) => ({
        ...requirement,
        name: getSkillById(requirement.skillId)?.name ?? requirement.skillId
      }));
      const effectiveShiftNeedsDelta = adjustActivityNeedsDelta(
        gameState.player.needs,
        job.effects.needsDelta,
        { scaleEnergyCost: true }
      );
      const company = getCareerCompanyById(job.companyId);
      const activeEmployment = gameState.player.career?.activeEmployment?.jobId === job.id
        ? gameState.player.career.activeEmployment
        : undefined;
      const probationDaysRemaining = activeEmployment?.status === 'probation' && activeEmployment.probationEndsDay
        ? Math.max(0, activeEmployment.probationEndsDay - gameState.time.day)
        : 0;

      return {
        job,
        location,
        district,
        company,
        employmentStatus: activeEmployment?.status,
        probationDaysRemaining,
        jobLevel: progress.currentLevel,
        nextJobLevel: progress.nextLevel,
        currentLevel: progress.currentLevel.level,
        maxLevel: job.levels.length,
        isCurrentJob: gameState.player.currentJobId === job.id,
        isAtWorkplace: gameState.player.locationId === job.locationId,
        completedShifts: gameState.player.completedShifts[job.id] ?? 0,
        jobExperience: progress.currentExperience,
        levelExperience: progress.levelExperience,
        levelExperienceRequired: progress.levelExperienceRequired,
        promotionThreshold: progress.promotionThreshold,
        experienceRemaining: progress.experienceRemaining,
        progressPercent: progress.progressPercent,
        isMaxLevel: progress.isMaxLevel,
        canApply: !applicationFailure,
        applicationFailure,
        canWorkShift: !shiftFailure,
        shiftFailure,
        canPromote: !promotionFailure,
        promotionFailure,
        missingSkillRequirements,
        effectiveShiftNeedsDelta,
        scheduleStatus: getScheduleStatus(job.shiftSchedule, gameState.time)
      };
    }

    const jobs = jobsCatalogue.map(buildJobView);
    const currentJobView = currentJob ? buildJobView(currentJob) : undefined;
    const currentLocationJobs = getJobsForLocation(gameState.player.locationId).map(buildJobView);

    return {
      jobs,
      currentJob,
      currentJobView,
      currentLocationJobs
    };
  }, [gameState.player, gameState.time, gameState.world.medical]);

  const financeState = useMemo(() => {
    const finance = gameState.world.finance;
    const housing = getHousingById(gameState.player.housingId);
    const upcomingPayments: UpcomingPayment[] = [];
    if (housing) {
      upcomingPayments.push({
        id: 'housing_rent',
        title: `Аренда: ${housing.name}`,
        amount: housing.rentPerWeek,
        dueDay: gameState.player.rentalContract.nextPaymentDay,
        category: 'housing'
      });
      upcomingPayments.push({
        id: 'housing_upkeep',
        title: 'Бытовые расходы',
        amount: housing.dailyUtilities,
        dueDay: gameState.time.day + 1,
        category: 'housing'
      });
    }
    const business = gameState.world.business.ownedBusiness;
    const premises = getBusinessPremisesById(business?.premisesId);
    if (business && premises) {
      upcomingPayments.push({
        id: 'business_rent',
        title: `Аренда бизнеса: ${business.name}`,
        amount: premises.rentPerWeek,
        dueDay: business.nextRentDay,
        category: 'business'
      });
    }
    return {
      finance,
      bankBalance: gameState.player.money,
      totalAssets: gameState.player.money + finance.cash + finance.savings,
      totalDebt: gameState.player.rentDebt + (business?.debt ?? 0),
      upcomingPayments: upcomingPayments.sort((a, b) => a.dueDay - b.dueDay)
    };
  }, [gameState.player.money, gameState.player.housingId, gameState.player.rentalContract.nextPaymentDay, gameState.player.rentDebt, gameState.time.day, gameState.world.finance, gameState.world.business]);


  const vehicleState = useMemo(() => {
    const world = gameState.world.vehicles;
    const currentLocation = getLocationById(gameState.player.locationId);
    const ownedVehicle = world.ownedVehicle;
    const ownedModel = getVehicleModelById(ownedVehicle?.modelId);
    const listings = world.usedListings.map((listing) => {
      const model = getVehicleModelById(listing.modelId);
      if (!model) return undefined;
      return {
        listing,
        model,
        inspected: world.inspectedListingIds.includes(listing.id),
        scheduled: world.scheduledInspectionListingId === listing.id,
        isAtSeller: gameState.player.locationId === listing.sellerLocationId,
        revealedDefects: world.inspectedListingIds.includes(listing.id) ? listing.hiddenDefectIds : []
      };
    }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    const dealerModels = newDealerVehicleModels.map((model) => ({
      model,
      dealerLocationId: getDealerLocationIdForModel(model),
      dealerLocation: getLocationById(getDealerLocationIdForModel(model)),
      isAtDealer: gameState.player.locationId === getDealerLocationIdForModel(model),
      canAfford: gameState.player.money >= model.newPrice
    }));
    return {
      world,
      listings,
      dealerModels,
      ownedVehicle,
      ownedModel,
      parkedLocation: getLocationById(ownedVehicle?.parkedLocationId),
      currentLocation,
      atGasStation: Boolean(currentLocation && GAS_STATION_LOCATION_IDS.includes(currentLocation.id)),
      atService: Boolean(currentLocation && SERVICE_LOCATION_IDS.includes(currentLocation.id)),
      fuelPriceLabel: ownedModel?.fuelType === 'diesel' ? '74 ₽/л' : ownedModel?.fuelType === 'petrol_92' ? '62 ₽/л' : '68 ₽/л'
    };
  }, [gameState.player.locationId, gameState.player.money, gameState.world.vehicles]);

  const intercityState = useMemo(
    () => selectIntercityState(gameState),
    [gameState.player.cityId, gameState.player.locationId, gameState.player.money, gameState.time, gameState.world.intercity, gameState.world.vehicles]
  );

  const universityState = useMemo(() => {
    const state = gameState.world.university;
    const enrollment = state.enrollment;
    const activeProgram = getDegreeProgramById(enrollment?.programId);
    const activeUniversity = getUniversityById(activeProgram?.universityId);
    const classes = getUniversityClasses({
      state,
      time: gameState.time,
      program: activeProgram,
      subjects: universitySubjectCatalogue,
      university: activeUniversity,
      currentLocationId: gameState.player.locationId
    });
    const programViews = degreeProgramsCatalogue.map((program) => {
      const university = getUniversityById(program.universityId);
      const application = getUniversityApplicationForProgram(state, program.id);
      const missingSkillRequirements = (program.requiredSkills ?? []).map((requirement) => ({
        ...requirement,
        name: getSkillById(requirement.skillId)?.name ?? String(requirement.skillId),
        currentLevel: gameState.player.skills[requirement.skillId]?.level ?? 0
      })).filter((entry) => entry.currentLevel < entry.minLevel);
      const examFailure = university
        ? getEntranceExamFailure({
            state,
            program,
            university,
            currentLocationId: gameState.player.locationId,
            currentTotalMinutes: getTotalMinutes(gameState.time)
          })
        : 'Университет не найден.';
      return {
        program,
        university,
        application,
        missingSkillRequirements,
        examFailure,
        canApply: !enrollment && missingSkillRequirements.length === 0 && (!application || application.status === 'failed'),
        canEnroll: application?.status === 'passed' && gameState.player.money >= program.tuitionPerSemester
      };
    });
    const campusPresence = activeUniversity
      ? getLocationPopulationPresence(gameState.world.population, activeUniversity.locationId)
      : undefined;
    return {
      state,
      programs: programViews,
      enrollment,
      activeProgram,
      activeUniversity,
      classes,
      assignments: enrollment?.assignments ?? [],
      campusPeople: [...(campusPresence?.staff ?? []), ...(campusPresence?.visitors ?? [])].slice(0, 12)
    };
  }, [gameState.player, gameState.time, gameState.world.population, gameState.world.university]);

  const scheduledWaitState = useMemo(() => selectScheduledWaitState({
    currentTotalMinutes: getTotalMinutes(gameState.time),
    currentLocationId: gameState.player.locationId,
    calendarEvents: gameState.world.phone.calendarEvents,
    universityClasses: universityState.classes,
    universityLocationId: universityState.activeUniversity?.locationId
  }), [gameState.player.locationId, gameState.time, gameState.world.phone.calendarEvents, universityState.activeUniversity?.locationId, universityState.classes]);

  const phoneState = useMemo(() => {
    const phone = gameState.world.phone;
    const currentLocation = getLocationById(gameState.player.locationId);
    const travelContext = { playerMoney: gameState.player.money, playerNeeds: gameState.player.needs };
    const jobs = jobsCatalogue.map((job) => {
      const location = getLocationById(job.locationId);
      const district = location ? getDistrictById(location.districtId) : undefined;
      const application = getJobApplicationForJob(phone, job.id);
      const degreeFailure = getCareerApplicationFailure(gameState.player, job, 'phone');
      const applicationFailure = getJobApplicationFailure(gameState.player, job) ?? degreeFailure;
      const missingSkillRequirements = getMissingSkillRequirements(gameState.player, job.requirements?.skills).map((requirement) => ({
        ...requirement,
        name: getSkillById(requirement.skillId)?.name ?? String(requirement.skillId)
      }));
      const interviewFailure = getInterviewFailure({
        state: phone,
        job,
        currentLocationId: gameState.player.locationId,
        currentTotalMinutes: getTotalMinutes(gameState.time)
      });
      const company = getCareerCompanyById(job.companyId);
      const requiredDegreeTitles = (job.requirements?.acceptedDegreeProgramIds ?? []).map((programId) => (
        getDegreeProgramById(programId)?.title ?? String(programId)
      ));
      return {
        job,
        location,
        district,
        company,
        requiredDegreeTitles,
        hasRequiredDegree: !degreeFailure,
        application,
        applicationFailure,
        missingSkillRequirements,
        interviewFailure,
        saved: phone.savedJobIds.includes(job.id),
        estimatedMonthlyIncome: Math.round(job.wagePerShift * 21)
      };
    });
    const mapTarget = getLocationById(phone.mapTargetLocationId);
    const mapRoute = mapTarget && mapTarget.cityId === currentLocation?.cityId
      ? addPersonalCarToLocationOptions(
          createLocationTravelOptions(currentLocation, [mapTarget], travelContext),
          currentLocation,
          gameState.world.vehicles
        )[0]
      : undefined;

    const currentJob = getJobById(gameState.player.currentJobId);
    const enrolledProgram = getDegreeProgramById(gameState.world.university.enrollment?.programId);
    const enrolledUniversity = getUniversityById(enrolledProgram?.universityId);
    const boxingLocationId = getBoxingGymById(gameState.player.boxing.membership?.gymId)?.locationId
      ?? boxingGymsCatalogue.find((gym) => getLocationById(gym.locationId)?.cityId === gameState.player.cityId)?.locationId;
    const ownedBusinessLocationId = getBusinessPremisesById(gameState.world.business.ownedBusiness?.premisesId)?.locationId;
    const contacts = Object.values(gameState.world.social.contacts)
      .map((contact) => {
        const npc = gameState.world.population.npcs.find((entry) => entry.id === contact.npcId);
        if (!npc) return undefined;
        const relationship = getNpcRelationship(gameState.world.social, npc.id);
        const role = getNpcRoleById(npc.employment?.roleId);
        const messages = phone.messages.filter((entry) => entry.npcId === npc.id).slice(0, 20);
        const circles = getNpcSocialCircles({
          npc,
          relationship,
          playerJobLocationId: currentJob?.locationId,
          universityLocationId: enrolledUniversity?.locationId,
          boxingLocationId,
          playerHomeDistrictId: String(gameState.player.districtId),
          businessLocationId: ownedBusinessLocationId
        });
        const quickMessages = socialQuickMessages.map((definition) => ({
          definition,
          failure: getSocialQuickMessageFailure({
            social: gameState.world.social,
            npcId: npc.id,
            definition,
            currentTotalMinutes: getTotalMinutes(gameState.time)
          })
        }));
        return {
          contact,
          npc,
          relationship,
          role,
          status: getRelationshipStatus(relationship),
          circles,
          messages,
          quickMessages,
          pendingInvitation: gameState.world.social.invitations.find((entry) => entry.npcId === npc.id && entry.status === 'pending'),
          scheduledMeeting: gameState.world.social.meetings.find((entry) => entry.npcId === npc.id && entry.status === 'scheduled')
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((left, right) => (right.contact.lastMessageTotalMinutes ?? right.contact.exchangedAtTotalMinutes) - (left.contact.lastMessageTotalMinutes ?? left.contact.exchangedAtTotalMinutes));
    const socialMeetingOptions = socialMeetingTypes.map((definition) => ({
      definition,
      locations: allLocations.filter((location) => (
        location.cityId === currentLocation?.cityId
        && definition.locationTypes.includes(location.type)
        && (!location.hiddenFromCityBrowser || location.id === getHousingById(gameState.player.housingId)?.locationId)
      ))
    }));
    const socialInvitations = gameState.world.social.invitations
      .filter((entry) => entry.direction === 'incoming' && entry.status === 'pending')
      .map((invitation) => ({
        invitation,
        npc: gameState.world.population.npcs.find((entry) => entry.id === invitation.npcId),
        definition: getSocialMeetingType(invitation.meetingTypeId),
        location: getLocationById(invitation.locationId)
      }));
    const socialMeetings = gameState.world.social.meetings
      .filter((entry) => entry.status === 'scheduled')
      .map((meeting) => {
        const definition = getSocialMeetingType(meeting.meetingTypeId);
        return {
          meeting,
          npc: gameState.world.population.npcs.find((entry) => entry.id === meeting.npcId),
          definition,
          location: getLocationById(meeting.locationId),
          failure: getSocialMeetingFailure({
            meeting,
            currentLocationId: gameState.player.locationId,
            currentTotalMinutes: getTotalMinutes(gameState.time),
            player: gameState.player,
            definition
          })
        };
      });

    return {
      phone,
      jobs,
      career: getCareerResume(gameState.player),
      unreadCount: getPhoneUnreadCount(phone),
      unreadMessages: phone.messages.filter((entry) => !entry.read).length,
      unreadNotifications: phone.notifications.filter((entry) => !entry.read).length,
      mapTarget,
      mapRoute,
      finance: financeState,
      vehicles: vehicleState,
      intercity: intercityState,
      university: universityState,
      social: { contacts, meetingOptions: socialMeetingOptions, invitations: socialInvitations, meetings: socialMeetings },
      districtTravelOptions: locationState.districtTravelOptions
    };
  }, [gameState.player, gameState.time, gameState.world.phone, gameState.world.vehicles, gameState.world.social, gameState.world.population, gameState.world.business, financeState, vehicleState, intercityState, universityState, locationState.districtTravelOptions]);

  const educationState = useMemo(() => {
    const skills = basicSkills.map((skill) => ({
      skill,
      progress: getSkillProgress(gameState.player.skills, skill.id)
    }));

    const programs = educationProgramsCatalogue.map((program) => {
      const currentLocation = getLocationById(gameState.player.locationId);
      const failure = getEducationProgramFailure(gameState.player, program, gameState.time, currentLocation?.type);
      return {
        program,
        skill: getSkillById(program.skillId),
        location: program.mode === 'self_study' ? currentLocation : getLocationById(program.locationId),
        canStudy: !failure,
        failure,
        scheduleStatus: getScheduleStatus(program.availabilitySchedule, gameState.time),
        effectiveNeedsDelta: adjustActivityNeedsDelta(
          gameState.player.needs,
          program.needsDelta ?? {},
          { scaleEnergyCost: true }
        )
      };
    });

    return { skills, programs };
  }, [gameState.player, gameState.time]);

  const boxingState = useMemo(() => {
    const gymViews = boxingGymsCatalogue.map((entry) => {
      const location = getLocationById(entry.locationId);
      const membershipActive = hasActiveBoxingMembership(gameState.player.boxing, entry, gameState.time.day);
      const membershipFailure = getBoxingMembershipFailure(gameState.player, gameState.time, entry, location?.openingHours);
      return {
        gym: entry,
        location,
        district: getDistrictById(location?.districtId ?? gameState.player.districtId),
        scheduleStatus: getScheduleStatus(location?.openingHours, gameState.time),
        isAtGym: gameState.player.locationId === entry.locationId,
        membershipActive,
        membershipFailure
      };
    });
    const cityGyms = gymViews.filter((entry) => entry.location?.cityId === gameState.player.cityId);
    const districtGyms = cityGyms.filter((entry) => entry.location?.districtId === gameState.player.districtId);
    const availableGyms = districtGyms.length > 0 ? districtGyms : cityGyms;
    const membershipGym = getBoxingGymById(gameState.player.boxing.membership?.gymId);
    const gym = membershipGym ?? getBoxingGymByLocationId(gameState.player.locationId) ?? availableGyms[0]?.gym;
    const gymLocation = getLocationById(gym?.locationId);
    const selectedTrainer = getBoxingTrainerById(gameState.player.boxing.selectedTrainerId);
    const membershipActive = gym ? hasActiveBoxingMembership(gameState.player.boxing, gym, gameState.time.day) : false;
    const membershipFailure = gym
      ? getBoxingMembershipFailure(gameState.player, gameState.time, gym, gymLocation?.openingHours)
      : 'Боксёрский зал не найден.';
    const trainers = boxingTrainersCatalogue
      .filter((trainer) => gym?.trainerIds.includes(trainer.id))
      .map((trainer) => {
        const failure = gym ? getBoxingTrainerSelectionFailure(gameState.player, gameState.time, gym, trainer) : 'Зал не найден.';
        return { trainer, selected: selectedTrainer?.id === trainer.id, canSelect: !failure, failure };
      });
    const trainings = boxingTrainings.map((training) => {
      const failure = getMedicalActivityFailure(gameState.world.medical, 'boxing_training')
        ?? (gym ? getBoxingTrainingFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        training,
        trainer: selectedTrainer,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.');
      return {
        training,
        canTrain: !failure,
        failure,
        sessionPrice: selectedTrainer?.sessionPrice ?? 0,
        effectiveNeedsDelta: adjustActivityNeedsDelta(gameState.player.needs, training.needsDelta, { scaleEnergyCost: true })
      };
    });
    const opponents = boxingOpponents.map((opponent) => {
      const failure = getMedicalActivityFailure(gameState.world.medical, 'sparring')
        ?? (gym ? getBoxingSparringFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        opponent,
        trainer: selectedTrainer,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.');
      return { opponent, canSpar: !failure, failure };
    });
    const tournaments = boxingTournaments.map((tournament) => {
      const failure = getMedicalActivityFailure(gameState.world.medical, 'tournament')
        ?? (gym ? getBoxingTournamentFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        tournament,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.');
      return { tournament, canEnter: !failure, failure };
    });

    return {
      profile: gameState.player.boxing,
      hasStartedBoxing: Boolean(gameState.player.boxing.membership || gameState.player.boxing.experience > 0 || gameState.player.boxing.fightHistory.length > 0),
      availableGyms,
      levelProgress: getBoxingLevelProgress(gameState.player.boxing),
      fatigueLabel: getBoxingFatigueLabel(gameState.player.boxing.fatigue),
      gym,
      gymLocation,
      gymScheduleStatus: getScheduleStatus(gymLocation?.openingHours, gameState.time),
      isAtGym: gameState.player.locationId === gym?.locationId,
      membershipActive,
      membershipFailure,
      selectedTrainer,
      trainers,
      trainings,
      opponents,
      tournaments
    };
  }, [gameState.player, gameState.time, gameState.world.medical]);

  const conditionState = useMemo(() => ({
    conditions: getNeedConditions(gameState.player.needs),
    consequences: getNeedsConsequences(gameState.player.needs)
  }), [gameState.player.needs]);

  const healthState = useMemo(() => {
    const conditions = gameState.world.medical.conditions.map((condition) => ({
      condition,
      definition: getMedicalConditionDefinition(condition.id)
    }));
    const services = medicalServicesCatalogue
      .filter((service) => getLocationById(service.clinicLocationId)?.cityId === gameState.player.cityId)
      .map((service) => {
      const clinic = getLocationById(service.clinicLocationId);
      const appointment = gameState.world.medical.appointments.find((entry) => entry.serviceId === service.id && entry.status === 'scheduled');
      const attendFailure = appointment
        ? getMedicalAppointmentFailure({
            state: gameState.world.medical,
            service,
            time: gameState.time,
            currentLocationId: gameState.player.locationId,
            playerMoney: gameState.player.money
          })
        : undefined;
      return {
        service,
        clinic,
        appointment,
        scheduleStatus: getScheduleStatus(service.schedule, gameState.time),
        attendFailure
      };
    });
    const prescriptions = gameState.world.medical.prescriptions.map((prescription) => ({
      prescription,
      product: getProductById(prescription.productId),
      conditionName: getMedicalConditionDefinition(prescription.conditionId)?.name ?? prescription.conditionId
    }));
    const symptoms = conditions.flatMap(({ condition, definition }) =>
      (definition?.symptoms ?? []).map((symptom) => ({ symptom, diagnosed: condition.diagnosed, conditionId: condition.id }))
    );
    return {
      medical: gameState.world.medical,
      conditions,
      services,
      prescriptions,
      symptoms,
      sickLeave: gameState.world.medical.sickLeave,
      upcomingAppointment: gameState.world.medical.appointments
        .filter((entry) => entry.status === 'scheduled')
        .sort((a, b) => a.startsAtTotalMinutes - b.startsAtTotalMinutes)[0]
    };
  }, [gameState.player.locationId, gameState.player.money, gameState.time, gameState.world.medical]);

  const housingState = useMemo(() => {
    const currentHousing = getHousingById(gameState.player.housingId);
    const currentDistrict = currentHousing ? getDistrictById(currentHousing.districtId) : undefined;
    const currentLocation = getLocationById(gameState.player.locationId);
    const travelContext = {
      playerMoney: gameState.player.money,
      playerNeeds: gameState.player.needs
    };
    const listings = gameState.world.housingMarket.activeHousingIds
      .map((id) => getHousingById(id))
      .filter((housing): housing is NonNullable<typeof housing> => Boolean(housing))
      .filter((housing) => getLocationById(housing.locationId)?.cityId === gameState.player.cityId)
      .map((housing) => {
        const location = getLocationById(housing.locationId);
        const district = getDistrictById(housing.districtId);
        const route = location
          ? createLocationTravelOptions(currentLocation, [location], travelContext)[0]
          : undefined;
        return {
          housing,
          location,
          district,
          route,
          affordability: getHousingAffordability(gameState.player, housing),
          isViewed: isHousingViewed(gameState.world.housingMarket, housing.id),
          isScheduled: gameState.world.housingMarket.scheduledViewingHousingId === housing.id,
          isAtLocation: gameState.player.locationId === housing.locationId
        };
      })
      .sort((left, right) => left.housing.rentPerWeek - right.housing.rentPerWeek);

    return {
      currentHousing,
      currentDistrict,
      contract: gameState.player.rentalContract,
      market: gameState.world.housingMarket,
      listings,
      daysUntilRefresh: Math.max(0, gameState.world.housingMarket.lastRefreshDay + 4 - gameState.time.day)
    };
  }, [gameState.player, gameState.time.day, gameState.world.housingMarket]);

  const businessState = useMemo(() => {
    const world = gameState.world.business;
    const selectedType = businessTypes[0];
    const premisesListings = world.activePremisesIds
      .map((id) => getBusinessPremisesById(id))
      .filter((premises): premises is NonNullable<typeof premises> => Boolean(premises))
      .filter((premises) => getLocationById(premises.locationId)?.cityId === gameState.player.cityId)
      .map((premises) => {
        const location = getLocationById(premises.locationId);
        const district = getDistrictById(premises.districtId);
        const startup = selectedType
          ? getBusinessStartupCost({ premises, businessType: selectedType, equipment: businessEquipment, supplies: businessSupplies })
          : { equipmentCost: 0, starterInventoryCost: 0, total: 0 };
        const failure = selectedType
          ? getBusinessLaunchFailure({ player: gameState.player, world, premises, businessType: selectedType, equipment: businessEquipment, supplies: businessSupplies })
          : 'Формат бизнеса не найден.';
        return {
          premises,
          location,
          district,
          startup,
          canLaunch: !failure,
          failure,
          isAtLocation: gameState.player.locationId === premises.locationId
        };
      })
      .sort((left, right) => left.premises.rentPerWeek - right.premises.rentPerWeek);

    const business = world.ownedBusiness;
    const premises = getBusinessPremisesById(business?.premisesId);
    const businessType = getBusinessTypeById(business?.typeId);
    const scheduleStatus = getScheduleStatus(business?.schedule, gameState.time);
    const menu = (businessType?.menuItemIds ?? [])
      .map((id) => getBusinessMenuItemById(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        item,
        price: business?.menuPrices[item.id] ?? item.recommendedPrice,
        canProduce: Boolean(business && item.ingredients.every((ingredient) => (business.inventory[ingredient.supplyId] ?? 0) >= ingredient.quantity))
      }));
    const supplies = businessSupplies.map((supply) => ({
      supply,
      quantity: business?.inventory[supply.id] ?? 0,
      batchCost: supply.unitCost * supply.purchaseBatch,
      canBuy: Boolean(business && business.balance >= supply.unitCost * supply.purchaseBatch)
    }));
    const equipment = businessEquipment.map((item) => ({
      equipment: item,
      owned: Boolean(business?.equipmentIds.includes(item.id)),
      canBuy: Boolean(business && !business.equipmentIds.includes(item.id) && business.balance >= item.price)
    }));
    const upgrades = businessUpgrades.map((upgrade) => ({
      upgrade,
      owned: Boolean(business?.upgradeIds.includes(upgrade.id)),
      canBuy: Boolean(business && !business.upgradeIds.includes(upgrade.id) && business.balance >= upgrade.price)
    }));
    const employees = (business?.employees ?? []).map((employee) => ({
      employee,
      npc: gameState.world.population.npcs.find((npc) => npc.id === employee.npcId),
      onShift: isBusinessEmployeeOnShift(employee, gameState.time)
    }));
    const candidates = getBusinessHireCandidates(gameState.world.population, world, gameState.time.day);
    const recentCustomers = (business?.lastCustomerNpcIds ?? [])
      .map((id) => gameState.world.population.npcs.find((npc) => npc.id === id))
      .filter((npc): npc is NonNullable<typeof npc> => Boolean(npc));
    const ownerShiftFailure = !business || !premises
      ? 'Сначала открой бизнес.'
      : gameState.player.locationId !== premises.locationId
        ? 'Нужно быть в своей кофейне.'
        : getScheduleActivityFailure(business.schedule, gameState.time, 240, 'Смена владельца')
          ?? getNeedsRequirementFailure(gameState.player.needs, { minEnergy: 20, minHealth: 25, minHunger: 6, minThirst: 6 });

    return {
      world,
      business,
      businessType,
      premises,
      premisesListings,
      scheduleStatus,
      menu,
      supplies,
      equipment,
      upgrades,
      employees,
      candidates,
      recentCustomers,
      ownerShiftFailure,
      canWorkOwnerShift: Boolean(business && premises && !ownerShiftFailure)
    };
  }, [gameState.player, gameState.time, gameState.world.business, gameState.world.population]);

  const populationState = useMemo(() => ({
    presence: getLocationPopulationPresence(gameState.world.population, gameState.player.locationId),
    summary: getPopulationSummary(gameState.world.population, gameState.time.day)
  }), [gameState.world.population, gameState.player.locationId, gameState.time.day]);

  const socialState = useMemo(() => {
    const presence = getLocationPopulationPresence(gameState.world.population, gameState.player.locationId);
    const presentNpcs = [...(presence?.staff ?? []), ...(presence?.visitors ?? [])];
    const presentIds = new Set(presentNpcs.map((npc) => String(npc.id)));
    const staffIds = new Set((presence?.staff ?? []).map((npc) => String(npc.id)));
    const currentJob = getJobById(gameState.player.currentJobId);

    function buildSocialNpcView(npc: Npc, isPresent: boolean): SocialNpcView {
      const relationship = getNpcRelationship(gameState.world.social, npc.id);
      const isColleague = Boolean(currentJob && npc.employment?.locationId === currentJob.locationId);
      const context = getNpcSocialContext(npc, gameState.player.locationId, isColleague);
      const interactions = npcInteractionTemplates
        .filter((interaction) => interaction.contexts.includes('general') || interaction.contexts.includes(context))
        .map((interaction) => {
          const failure = getInteractionFailure({
            player: gameState.player,
            npc,
            relationship,
            interaction,
            context,
            isPresent
          });
          return { interaction, available: !failure, failure };
        });

      const contactFailure = getContactExchangeFailure(gameState.world.social, npc.id);
      return {
        npc,
        role: getNpcRoleById(npc.employment?.roleId),
        relationship,
        status: getRelationshipStatus(relationship),
        context,
        isPresent,
        isStaff: staffIds.has(String(npc.id)),
        isColleague,
        isKnown: relationship.familiarity >= 5 || relationship.interactionCount > 0,
        contactUnlocked: Boolean(gameState.world.social.contacts[String(npc.id)]),
        contactFailure,
        interactions
      };
    }

    const currentPeople = presentNpcs.map((npc) => buildSocialNpcView(npc, true));
    const knownPeople = gameState.world.population.npcs
      .filter((npc) => {
        const relationship = gameState.world.social.relationships[String(npc.id)];
        return Boolean(relationship && (relationship.familiarity >= 5 || relationship.interactionCount > 0));
      })
      .map((npc) => buildSocialNpcView(npc, presentIds.has(String(npc.id))))
      .sort((left, right) => (right.relationship.lastInteractionDay ?? 0) - (left.relationship.lastInteractionDay ?? 0));
    const colleagues = currentJob
      ? gameState.world.population.npcs
          .filter((npc) => npc.employment?.locationId === currentJob.locationId)
          .map((npc) => buildSocialNpcView(npc, presentIds.has(String(npc.id))))
          .sort((left, right) => {
            const leftManagement = left.role?.category === 'management' ? 0 : 1;
            const rightManagement = right.role?.category === 'management' ? 0 : 1;
            return leftManagement - rightManagement || left.npc.lastName.localeCompare(right.npc.lastName, 'ru');
          })
      : [];
    const activeEventNpc = gameState.world.social.activeEvent
      ? gameState.world.population.npcs.find((npc) => npc.id === gameState.world.social.activeEvent?.npcId)
      : undefined;

    return {
      currentPeople,
      knownPeople,
      colleagues,
      activeEvent: gameState.world.social.activeEvent,
      activeEventNpc,
      history: gameState.world.social.history,
      scheduledCount: gameState.world.social.scheduledEvents.length + gameState.world.social.meetings.filter((entry) => entry.status === 'scheduled').length
    };
  }, [gameState.player, gameState.world.population, gameState.world.social]);


  return {
    gameState,
    actions: locationState.actions,
    locationState,
    jobState,
    educationState,
    boxingState,
    conditionState,
    populationState,
    socialState,
    housingState,
    businessState,
    phoneState,
    financeState,
    vehicleState,
    healthState,
    universityState,
    scheduledWaitState,
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
    applyForJob,
    promoteJob,
    workShift,
    resignCurrentJob,
    studyProgram,
    buyBoxingMembership,
    chooseBoxingTrainer,
    performBoxingTraining,
    startBoxingSparring,
    enterBoxingTournament,
    interactWithNpc,
    exchangeNpcContact,
    sendNpcPhoneMessage,
    inviteNpcToMeeting,
    respondNpcMeetingInvitation,
    attendNpcMeeting,
    cancelNpcMeeting,
    chooseSocialEvent,
    scheduleHousingViewing: scheduleHousingViewingAction,
    viewHousing,
    rentHousing,
    openCoffeeBusiness,
    purchaseBusinessSupply,
    changeBusinessMenuPrice,
    hireBusinessNpc,
    fireBusinessNpc,
    addBusinessFunds,
    purchaseBusinessEquipment,
    purchaseBusinessUpgrade,
    workBusinessOwnerShift,
    submitJobApplication,
    togglePhoneSavedJob,
    setPhoneMapLocation,
    readPhoneNotification,
    readPhoneMessage,
    attendJobInterview,
    scheduleMedicalVisit,
    attendMedicalVisit,
    requestSickLeave,
    transferPersonalFunds,
    updateAutoSave,
    addSavingsGoal,
    addMoneyToSavingsGoal,
    scheduleVehicleInspection: scheduleVehicleInspectionAction,
    inspectVehicle: inspectVehicleAction,
    buyUsedVehicle: buyUsedVehicleAction,
    buyNewVehicle: buyNewVehicleAction,
    refuelVehicle: refuelOwnedVehicle,
    serviceVehicle: serviceOwnedVehicle,
    sellVehicle: sellOwnedVehicleAction,
    buyIntercityTicket: buyIntercityTicketAction,
    boardIntercityTicket: boardIntercityTicketAction,
    bookTemporaryAccommodation: bookTemporaryAccommodationAction,
    driveIntercity: driveIntercityAction,
    submitDegreeApplication,
    attendDegreeEntranceExam,
    enrollDegreeProgram,
    attendDegreeClass,
    completeDegreeAssignment,
    takeDegreeSemesterExam,
    skipGameTime,
    resetGame
  };
}
