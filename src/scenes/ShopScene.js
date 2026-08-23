import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { BAIT } from '../data/baitData.js';
import { getCatchable, sizeScaleFor } from '../data/catchables.js';
import { currentUpgrade, nextUpgrade } from '../data/upgradeData.js';
import { createBubbleButton } from '../ui/BubbleButton.js';
import { createIconButton, drawCloseIcon } from '../ui/iconButton.js';
import { createSearchBox } from '../ui/SearchBox.js';
import { addStatusBar } from '../ui/fishIcon.js';
import {
  drawPrawn,
  drawSquid,
  drawFlathead,
  drawRedMorwong,
  drawBandedMorwong,
  drawBlueMorwong,
  drawHairtail,
  drawHapuku,
  drawLeatherjacket,
  drawLongtailTuna,
  drawYellowfinTuna,
  drawSouthernBluefinTuna,
  drawBigeyeTuna,
  drawSkipjackTuna,
  drawBlackfinTuna,
  drawDogtoothTuna,
  drawLuderick,
  drawSpanishMackerel,
  drawSchoolMackerel,
  drawKingMackerel,
  drawMahiMahi,
  drawMangroveJack,
  drawBlackMarlin,
  drawBlueMarlin,
  drawStripedMarlin,
  drawWhiteMarlin,
  drawMosesPerch,
  drawMulloway,
  drawPearlPerch,
  drawPinkSnapper,
  drawRedSnapper,
  drawMangroveSnapper,
  drawVermilionSnapper,
  drawSilkSnapper,
  drawQueenfish,
  drawRedEmperor,
  drawCrimsonSnapper,
  drawFingermark,
  drawNannygai,
  drawSailfish,
  drawSamsonfish,
  drawSandWhiting,
  drawSchoolWhiting,
  drawKingGeorgeWhiting,
  drawYellowfinWhiting,
  drawTrumpeterWhiting,
  drawSnook,
  drawTeraglin,
  drawWahoo,
  drawDhufish,
  drawBaldchinGroper,
  drawTuskfish,
  drawBlackspotTuskfish,
  drawBlueTuskfish,
  drawBlackSeaBass,
  drawGagGrouper,
  drawRedGrouper,
  drawBlackGrouper,
  drawScamp,
  drawWarsawGrouper,
  drawRedDrum,
  drawBlackDrum,
  drawSpottedSeatrout,
  drawWeakfish,
  drawTarpon,
  drawBonefish,
  drawPermit,
  drawStripedBass,
  drawSheepshead,
  drawHogfish,
  drawFloridaPompano,
  drawCrevalleJack,
  drawLadyfish,
  drawTripletail,
  drawAtlanticCroaker,
  drawSpot,
  drawPigfish,
  drawWhiteGrunt,
  drawRedPorgy,
  drawScup,
  drawTautog,
  drawGoldenTilefish,
  drawBlueLineTilefish,
  drawAtlanticMackerel,
  drawCeroMackerel,
  drawLittleTunny,
  drawAtlanticBonito,
  drawShortfinMako,
  drawWhalerShark,
  drawBronzeWhaler,
  drawDuskyShark,
  drawBlacktipShark,
  drawSpinnerShark,
  drawHammerhead,
  drawScallopedHammerhead,
  drawGreatHammerhead,
  drawWobbegong,
  drawOrnateWobbegong,
  drawSpottedWobbegong,
  drawGummyShark,
  drawSchoolShark,
  drawBlueShark,
  drawSpinyDogfish,
  drawSmoothDogfish,
  drawSevenGilledShark,
  drawSixGilledShark,
  drawSawshark,
  drawThresherShark,
  drawAngelShark,
  drawNurseShark,
  drawLemonShark,
  drawSandbarShark,
  drawBlacktipReefShark,
  drawGuitarfish,
  drawShovelnoseRay,
  drawEagleRay,
  drawMantaRay,
  drawDevilRay,
  drawStingray,
  drawSouthernStingray,
  drawCownoseRay,
  drawButterflyRay,
  drawElectricRay,
  drawTorpedoRay,
  drawBanjoRay,
  drawFiddlerRay,
  drawBarndoorSkate,
  drawWinterSkate,
  drawClearnoseSkate,
  drawLittleSkate,
  drawGreatBarracuda,
  drawPickhandleBarracuda,
  drawFatSnook,
  drawAfricanPompano,
  drawLookdown,
  drawSouthernFlounder,
  drawSummerFlounder,
  drawGarfish,
  drawSouthernGarfish,
  drawGemfish,
  drawGiantTrevally,
  drawGoldenTrevally,
  drawSilverTrevally,
  drawGreyMorwong,
  drawJackassMorwong,
  drawBlueGroper,
  drawBonito,
  drawCobia,
  drawDuskyFlathead,
  drawTigerFlathead,
  drawBluespottedFlathead,
  drawSandFlathead,
  drawRockFlathead,
  drawFlounder,
  drawAustralianSalmon,
  drawAustralianHerring,
  drawAlbacore,
  drawAmberjack,
  drawBarramundi,
  drawBlackBream,
  drawYellowfinBream,
  drawTarwhine,
  drawBlackJewfish,
  drawBlueEyeTrevalla,
  drawMullet,
  drawBream,
  drawTuna,
  drawSpottedMackerel,
  drawTailor,
  drawTrevally,
  drawKingfish,
  drawWhiting,
  drawCoralTrout,
  drawAngler,
  drawGreatWhite,
  drawTigerShark,
  drawBullShark,
  drawMegalodon,
  drawOldBoot
} from '../ui/tackle.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { heading, subheading, label } from '../ui/textStyle.js';

// Base icon scale for an average-sized one of each - a specific catch's
// actual weight then grows or shrinks it from there, so a heavier catch
// visibly looks bigger in the list than a lighter one of the same species.
const CATCH_DRAWERS = {
  flathead: (g, x, y, weightKg) => drawFlathead(g, x, y, 1.0 * sizeScaleFor('flathead', weightKg)),
  red_morwong: (g, x, y, weightKg) => drawRedMorwong(g, x, y, 0.85 * sizeScaleFor('red_morwong', weightKg)),
  banded_morwong: (g, x, y, weightKg) => drawBandedMorwong(g, x, y, 0.82 * sizeScaleFor('banded_morwong', weightKg)),
  blue_morwong: (g, x, y, weightKg) => drawBlueMorwong(g, x, y, 0.78 * sizeScaleFor('blue_morwong', weightKg)),
  hairtail: (g, x, y, weightKg) => drawHairtail(g, x, y, 0.55 * sizeScaleFor('hairtail', weightKg)),
  hapuku: (g, x, y, weightKg) => drawHapuku(g, x, y, 0.6 * sizeScaleFor('hapuku', weightKg)),
  leatherjacket: (g, x, y, weightKg) => drawLeatherjacket(g, x, y, 1.15 * sizeScaleFor('leatherjacket', weightKg)),
  longtail_tuna: (g, x, y, weightKg) => drawLongtailTuna(g, x, y, 0.72 * sizeScaleFor('longtail_tuna', weightKg)),
  yellowfin_tuna: (g, x, y, weightKg) => drawYellowfinTuna(g, x, y, 0.68 * sizeScaleFor('yellowfin_tuna', weightKg)),
  southern_bluefin_tuna: (g, x, y, weightKg) =>
    drawSouthernBluefinTuna(g, x, y, 0.72 * sizeScaleFor('southern_bluefin_tuna', weightKg)),
  bigeye_tuna: (g, x, y, weightKg) => drawBigeyeTuna(g, x, y, 0.7 * sizeScaleFor('bigeye_tuna', weightKg)),
  skipjack_tuna: (g, x, y, weightKg) => drawSkipjackTuna(g, x, y, 0.85 * sizeScaleFor('skipjack_tuna', weightKg)),
  blackfin_tuna: (g, x, y, weightKg) => drawBlackfinTuna(g, x, y, 0.8 * sizeScaleFor('blackfin_tuna', weightKg)),
  dogtooth_tuna: (g, x, y, weightKg) => drawDogtoothTuna(g, x, y, 0.68 * sizeScaleFor('dogtooth_tuna', weightKg)),
  luderick: (g, x, y, weightKg) => drawLuderick(g, x, y, 0.95 * sizeScaleFor('luderick', weightKg)),
  spanish_mackerel: (g, x, y, weightKg) => drawSpanishMackerel(g, x, y, 0.62 * sizeScaleFor('spanish_mackerel', weightKg)),
  school_mackerel: (g, x, y, weightKg) => drawSchoolMackerel(g, x, y, 0.85 * sizeScaleFor('school_mackerel', weightKg)),
  king_mackerel: (g, x, y, weightKg) => drawKingMackerel(g, x, y, 0.66 * sizeScaleFor('king_mackerel', weightKg)),
  mahi_mahi: (g, x, y, weightKg) => drawMahiMahi(g, x, y, 0.66 * sizeScaleFor('mahi_mahi', weightKg)),
  mangrove_jack: (g, x, y, weightKg) => drawMangroveJack(g, x, y, 0.85 * sizeScaleFor('mangrove_jack', weightKg)),
  black_marlin: (g, x, y, weightKg) => drawBlackMarlin(g, x, y, 0.42 * sizeScaleFor('black_marlin', weightKg)),
  blue_marlin: (g, x, y, weightKg) => drawBlueMarlin(g, x, y, 0.38 * sizeScaleFor('blue_marlin', weightKg)),
  striped_marlin: (g, x, y, weightKg) => drawStripedMarlin(g, x, y, 0.44 * sizeScaleFor('striped_marlin', weightKg)),
  white_marlin: (g, x, y, weightKg) => drawWhiteMarlin(g, x, y, 0.56 * sizeScaleFor('white_marlin', weightKg)),
  moses_perch: (g, x, y, weightKg) => drawMosesPerch(g, x, y, 1.0 * sizeScaleFor('moses_perch', weightKg)),
  mulloway: (g, x, y, weightKg) => drawMulloway(g, x, y, 0.62 * sizeScaleFor('mulloway', weightKg)),
  pearl_perch: (g, x, y, weightKg) => drawPearlPerch(g, x, y, 0.85 * sizeScaleFor('pearl_perch', weightKg)),
  pink_snapper: (g, x, y, weightKg) => drawPinkSnapper(g, x, y, 0.78 * sizeScaleFor('pink_snapper', weightKg)),
  red_snapper: (g, x, y, weightKg) => drawRedSnapper(g, x, y, 0.78 * sizeScaleFor('red_snapper', weightKg)),
  mangrove_snapper: (g, x, y, weightKg) => drawMangroveSnapper(g, x, y, 0.78 * sizeScaleFor('mangrove_snapper', weightKg)),
  vermilion_snapper: (g, x, y, weightKg) => drawVermilionSnapper(g, x, y, 0.85 * sizeScaleFor('vermilion_snapper', weightKg)),
  silk_snapper: (g, x, y, weightKg) => drawSilkSnapper(g, x, y, 0.78 * sizeScaleFor('silk_snapper', weightKg)),
  queenfish: (g, x, y, weightKg) => drawQueenfish(g, x, y, 0.68 * sizeScaleFor('queenfish', weightKg)),
  red_emperor: (g, x, y, weightKg) => drawRedEmperor(g, x, y, 0.72 * sizeScaleFor('red_emperor', weightKg)),
  crimson_snapper: (g, x, y, weightKg) => drawCrimsonSnapper(g, x, y, 0.78 * sizeScaleFor('crimson_snapper', weightKg)),
  fingermark: (g, x, y, weightKg) => drawFingermark(g, x, y, 0.72 * sizeScaleFor('fingermark', weightKg)),
  nannygai: (g, x, y, weightKg) => drawNannygai(g, x, y, 0.9 * sizeScaleFor('nannygai', weightKg)),
  sailfish: (g, x, y, weightKg) => drawSailfish(g, x, y, 0.5 * sizeScaleFor('sailfish', weightKg)),
  samsonfish: (g, x, y, weightKg) => drawSamsonfish(g, x, y, 0.78 * sizeScaleFor('samsonfish', weightKg)),
  sand_whiting: (g, x, y, weightKg) => drawSandWhiting(g, x, y, 1.05 * sizeScaleFor('sand_whiting', weightKg)),
  school_whiting: (g, x, y, weightKg) => drawSchoolWhiting(g, x, y, 1.3 * sizeScaleFor('school_whiting', weightKg)),
  king_george_whiting: (g, x, y, weightKg) => drawKingGeorgeWhiting(g, x, y, 1.05 * sizeScaleFor('king_george_whiting', weightKg)),
  yellowfin_whiting: (g, x, y, weightKg) => drawYellowfinWhiting(g, x, y, 1.15 * sizeScaleFor('yellowfin_whiting', weightKg)),
  trumpeter_whiting: (g, x, y, weightKg) => drawTrumpeterWhiting(g, x, y, 1.15 * sizeScaleFor('trumpeter_whiting', weightKg)),
  snook: (g, x, y, weightKg) => drawSnook(g, x, y, 0.85 * sizeScaleFor('snook', weightKg)),
  teraglin: (g, x, y, weightKg) => drawTeraglin(g, x, y, 0.88 * sizeScaleFor('teraglin', weightKg)),
  wahoo: (g, x, y, weightKg) => drawWahoo(g, x, y, 0.6 * sizeScaleFor('wahoo', weightKg)),
  dhufish: (g, x, y, weightKg) => drawDhufish(g, x, y, 0.72 * sizeScaleFor('dhufish', weightKg)),
  baldchin_groper: (g, x, y, weightKg) => drawBaldchinGroper(g, x, y, 0.8 * sizeScaleFor('baldchin_groper', weightKg)),
  tuskfish: (g, x, y, weightKg) => drawTuskfish(g, x, y, 0.85 * sizeScaleFor('tuskfish', weightKg)),
  blackspot_tuskfish: (g, x, y, weightKg) => drawBlackspotTuskfish(g, x, y, 0.82 * sizeScaleFor('blackspot_tuskfish', weightKg)),
  blue_tuskfish: (g, x, y, weightKg) => drawBlueTuskfish(g, x, y, 0.82 * sizeScaleFor('blue_tuskfish', weightKg)),
  black_sea_bass: (g, x, y, weightKg) => drawBlackSeaBass(g, x, y, 0.78 * sizeScaleFor('black_sea_bass', weightKg)),
  gag_grouper: (g, x, y, weightKg) => drawGagGrouper(g, x, y, 0.7 * sizeScaleFor('gag_grouper', weightKg)),
  red_grouper: (g, x, y, weightKg) => drawRedGrouper(g, x, y, 0.72 * sizeScaleFor('red_grouper', weightKg)),
  black_grouper: (g, x, y, weightKg) => drawBlackGrouper(g, x, y, 0.7 * sizeScaleFor('black_grouper', weightKg)),
  scamp: (g, x, y, weightKg) => drawScamp(g, x, y, 0.78 * sizeScaleFor('scamp', weightKg)),
  warsaw_grouper: (g, x, y, weightKg) => drawWarsawGrouper(g, x, y, 0.6 * sizeScaleFor('warsaw_grouper', weightKg)),
  red_drum: (g, x, y, weightKg) => drawRedDrum(g, x, y, 0.76 * sizeScaleFor('red_drum', weightKg)),
  black_drum: (g, x, y, weightKg) => drawBlackDrum(g, x, y, 0.68 * sizeScaleFor('black_drum', weightKg)),
  spotted_seatrout: (g, x, y, weightKg) => drawSpottedSeatrout(g, x, y, 0.82 * sizeScaleFor('spotted_seatrout', weightKg)),
  weakfish: (g, x, y, weightKg) => drawWeakfish(g, x, y, 0.8 * sizeScaleFor('weakfish', weightKg)),
  tarpon: (g, x, y, weightKg) => drawTarpon(g, x, y, 0.62 * sizeScaleFor('tarpon', weightKg)),
  bonefish: (g, x, y, weightKg) => drawBonefish(g, x, y, 0.8 * sizeScaleFor('bonefish', weightKg)),
  permit: (g, x, y, weightKg) => drawPermit(g, x, y, 0.7 * sizeScaleFor('permit', weightKg)),
  striped_bass: (g, x, y, weightKg) => drawStripedBass(g, x, y, 0.76 * sizeScaleFor('striped_bass', weightKg)),
  sheepshead: (g, x, y, weightKg) => drawSheepshead(g, x, y, 0.78 * sizeScaleFor('sheepshead', weightKg)),
  hogfish: (g, x, y, weightKg) => drawHogfish(g, x, y, 0.76 * sizeScaleFor('hogfish', weightKg)),
  florida_pompano: (g, x, y, weightKg) => drawFloridaPompano(g, x, y, 0.85 * sizeScaleFor('florida_pompano', weightKg)),
  crevalle_jack: (g, x, y, weightKg) => drawCrevalleJack(g, x, y, 0.7 * sizeScaleFor('crevalle_jack', weightKg)),
  ladyfish: (g, x, y, weightKg) => drawLadyfish(g, x, y, 0.9 * sizeScaleFor('ladyfish', weightKg)),
  tripletail: (g, x, y, weightKg) => drawTripletail(g, x, y, 0.85 * sizeScaleFor('tripletail', weightKg)),
  atlantic_croaker: (g, x, y, weightKg) => drawAtlanticCroaker(g, x, y, 1.05 * sizeScaleFor('atlantic_croaker', weightKg)),
  spot: (g, x, y, weightKg) => drawSpot(g, x, y, 1.3 * sizeScaleFor('spot', weightKg)),
  pigfish: (g, x, y, weightKg) => drawPigfish(g, x, y, 1.05 * sizeScaleFor('pigfish', weightKg)),
  white_grunt: (g, x, y, weightKg) => drawWhiteGrunt(g, x, y, 0.98 * sizeScaleFor('white_grunt', weightKg)),
  red_porgy: (g, x, y, weightKg) => drawRedPorgy(g, x, y, 0.84 * sizeScaleFor('red_porgy', weightKg)),
  scup: (g, x, y, weightKg) => drawScup(g, x, y, 1.1 * sizeScaleFor('scup', weightKg)),
  tautog: (g, x, y, weightKg) => drawTautog(g, x, y, 0.82 * sizeScaleFor('tautog', weightKg)),
  golden_tilefish: (g, x, y, weightKg) => drawGoldenTilefish(g, x, y, 0.72 * sizeScaleFor('golden_tilefish', weightKg)),
  blueline_tilefish: (g, x, y, weightKg) => drawBlueLineTilefish(g, x, y, 0.82 * sizeScaleFor('blueline_tilefish', weightKg)),
  atlantic_mackerel: (g, x, y, weightKg) => drawAtlanticMackerel(g, x, y, 0.95 * sizeScaleFor('atlantic_mackerel', weightKg)),
  cero_mackerel: (g, x, y, weightKg) => drawCeroMackerel(g, x, y, 0.7 * sizeScaleFor('cero_mackerel', weightKg)),
  little_tunny: (g, x, y, weightKg) => drawLittleTunny(g, x, y, 0.8 * sizeScaleFor('little_tunny', weightKg)),
  atlantic_bonito: (g, x, y, weightKg) => drawAtlanticBonito(g, x, y, 0.72 * sizeScaleFor('atlantic_bonito', weightKg)),
  shortfin_mako: (g, x, y, weightKg) => drawShortfinMako(g, x, y, 0.56 * sizeScaleFor('shortfin_mako', weightKg)),
  whaler_shark: (g, x, y, weightKg) => drawWhalerShark(g, x, y, 0.5 * sizeScaleFor('whaler_shark', weightKg)),
  bronze_whaler: (g, x, y, weightKg) => drawBronzeWhaler(g, x, y, 0.52 * sizeScaleFor('bronze_whaler', weightKg)),
  dusky_shark: (g, x, y, weightKg) => drawDuskyShark(g, x, y, 0.58 * sizeScaleFor('dusky_shark', weightKg)),
  blacktip_shark: (g, x, y, weightKg) => drawBlacktipShark(g, x, y, 0.45 * sizeScaleFor('blacktip_shark', weightKg)),
  spinner_shark: (g, x, y, weightKg) => drawSpinnerShark(g, x, y, 0.46 * sizeScaleFor('spinner_shark', weightKg)),
  hammerhead: (g, x, y, weightKg) => drawHammerhead(g, x, y, 0.53 * sizeScaleFor('hammerhead', weightKg)),
  scalloped_hammerhead: (g, x, y, weightKg) => drawScallopedHammerhead(g, x, y, 0.54 * sizeScaleFor('scalloped_hammerhead', weightKg)),
  great_hammerhead: (g, x, y, weightKg) => drawGreatHammerhead(g, x, y, 0.65 * sizeScaleFor('great_hammerhead', weightKg)),
  wobbegong: (g, x, y, weightKg) => drawWobbegong(g, x, y, 0.72 * sizeScaleFor('wobbegong', weightKg)),
  ornate_wobbegong: (g, x, y, weightKg) => drawOrnateWobbegong(g, x, y, 0.74 * sizeScaleFor('ornate_wobbegong', weightKg)),
  spotted_wobbegong: (g, x, y, weightKg) => drawSpottedWobbegong(g, x, y, 0.76 * sizeScaleFor('spotted_wobbegong', weightKg)),
  gummy_shark: (g, x, y, weightKg) => drawGummyShark(g, x, y, 0.62 * sizeScaleFor('gummy_shark', weightKg)),
  school_shark: (g, x, y, weightKg) => drawSchoolShark(g, x, y, 0.6 * sizeScaleFor('school_shark', weightKg)),
  blue_shark: (g, x, y, weightKg) => drawBlueShark(g, x, y, 0.54 * sizeScaleFor('blue_shark', weightKg)),
  spiny_dogfish: (g, x, y, weightKg) => drawSpinyDogfish(g, x, y, 0.95 * sizeScaleFor('spiny_dogfish', weightKg)),
  smooth_dogfish: (g, x, y, weightKg) => drawSmoothDogfish(g, x, y, 0.98 * sizeScaleFor('smooth_dogfish', weightKg)),
  seven_gilled_shark: (g, x, y, weightKg) => drawSevenGilledShark(g, x, y, 0.57 * sizeScaleFor('seven_gilled_shark', weightKg)),
  six_gilled_shark: (g, x, y, weightKg) => drawSixGilledShark(g, x, y, 0.5 * sizeScaleFor('six_gilled_shark', weightKg)),
  sawshark: (g, x, y, weightKg) => drawSawshark(g, x, y, 0.9 * sizeScaleFor('sawshark', weightKg)),
  thresher_shark: (g, x, y, weightKg) => drawThresherShark(g, x, y, 0.44 * sizeScaleFor('thresher_shark', weightKg)),
  angel_shark: (g, x, y, weightKg) => drawAngelShark(g, x, y, 0.68 * sizeScaleFor('angel_shark', weightKg)),
  nurse_shark: (g, x, y, weightKg) => drawNurseShark(g, x, y, 0.56 * sizeScaleFor('nurse_shark', weightKg)),
  lemon_shark: (g, x, y, weightKg) => drawLemonShark(g, x, y, 0.58 * sizeScaleFor('lemon_shark', weightKg)),
  sandbar_shark: (g, x, y, weightKg) => drawSandbarShark(g, x, y, 0.54 * sizeScaleFor('sandbar_shark', weightKg)),
  blacktip_reef_shark: (g, x, y, weightKg) => drawBlacktipReefShark(g, x, y, 0.72 * sizeScaleFor('blacktip_reef_shark', weightKg)),
  guitarfish: (g, x, y, weightKg) => drawGuitarfish(g, x, y, 0.62 * sizeScaleFor('guitarfish', weightKg)),
  shovelnose_ray: (g, x, y, weightKg) => drawShovelnoseRay(g, x, y, 0.62 * sizeScaleFor('shovelnose_ray', weightKg)),
  eagle_ray: (g, x, y, weightKg) => drawEagleRay(g, x, y, 0.6 * sizeScaleFor('eagle_ray', weightKg)),
  manta_ray: (g, x, y, weightKg) => drawMantaRay(g, x, y, 0.42 * sizeScaleFor('manta_ray', weightKg)),
  devil_ray: (g, x, y, weightKg) => drawDevilRay(g, x, y, 0.58 * sizeScaleFor('devil_ray', weightKg)),
  stingray: (g, x, y, weightKg) => drawStingray(g, x, y, 0.72 * sizeScaleFor('stingray', weightKg)),
  southern_stingray: (g, x, y, weightKg) => drawSouthernStingray(g, x, y, 0.68 * sizeScaleFor('southern_stingray', weightKg)),
  cownose_ray: (g, x, y, weightKg) => drawCownoseRay(g, x, y, 0.62 * sizeScaleFor('cownose_ray', weightKg)),
  butterfly_ray: (g, x, y, weightKg) => drawButterflyRay(g, x, y, 0.6 * sizeScaleFor('butterfly_ray', weightKg)),
  electric_ray: (g, x, y, weightKg) => drawElectricRay(g, x, y, 0.78 * sizeScaleFor('electric_ray', weightKg)),
  torpedo_ray: (g, x, y, weightKg) => drawTorpedoRay(g, x, y, 0.68 * sizeScaleFor('torpedo_ray', weightKg)),
  banjo_ray: (g, x, y, weightKg) => drawBanjoRay(g, x, y, 0.64 * sizeScaleFor('banjo_ray', weightKg)),
  fiddler_ray: (g, x, y, weightKg) => drawFiddlerRay(g, x, y, 0.64 * sizeScaleFor('fiddler_ray', weightKg)),
  barndoor_skate: (g, x, y, weightKg) => drawBarndoorSkate(g, x, y, 0.68 * sizeScaleFor('barndoor_skate', weightKg)),
  winter_skate: (g, x, y, weightKg) => drawWinterSkate(g, x, y, 0.8 * sizeScaleFor('winter_skate', weightKg)),
  clearnose_skate: (g, x, y, weightKg) => drawClearnoseSkate(g, x, y, 0.86 * sizeScaleFor('clearnose_skate', weightKg)),
  little_skate: (g, x, y, weightKg) => drawLittleSkate(g, x, y, 1.15 * sizeScaleFor('little_skate', weightKg)),
  great_barracuda: (g, x, y, weightKg) => drawGreatBarracuda(g, x, y, 0.68 * sizeScaleFor('great_barracuda', weightKg)),
  pickhandle_barracuda: (g, x, y, weightKg) => drawPickhandleBarracuda(g, x, y, 0.84 * sizeScaleFor('pickhandle_barracuda', weightKg)),
  fat_snook: (g, x, y, weightKg) => drawFatSnook(g, x, y, 0.82 * sizeScaleFor('fat_snook', weightKg)),
  african_pompano: (g, x, y, weightKg) => drawAfricanPompano(g, x, y, 0.78 * sizeScaleFor('african_pompano', weightKg)),
  lookdown: (g, x, y, weightKg) => drawLookdown(g, x, y, 1.1 * sizeScaleFor('lookdown', weightKg)),
  southern_flounder: (g, x, y, weightKg) => drawSouthernFlounder(g, x, y, 0.85 * sizeScaleFor('southern_flounder', weightKg)),
  summer_flounder: (g, x, y, weightKg) => drawSummerFlounder(g, x, y, 0.9 * sizeScaleFor('summer_flounder', weightKg)),
  garfish: (g, x, y, weightKg) => drawGarfish(g, x, y, 1.1 * sizeScaleFor('garfish', weightKg)),
  southern_garfish: (g, x, y, weightKg) => drawSouthernGarfish(g, x, y, 1.1 * sizeScaleFor('southern_garfish', weightKg)),
  gemfish: (g, x, y, weightKg) => drawGemfish(g, x, y, 0.85 * sizeScaleFor('gemfish', weightKg)),
  giant_trevally: (g, x, y, weightKg) => drawGiantTrevally(g, x, y, 0.6 * sizeScaleFor('giant_trevally', weightKg)),
  golden_trevally: (g, x, y, weightKg) => drawGoldenTrevally(g, x, y, 0.78 * sizeScaleFor('golden_trevally', weightKg)),
  silver_trevally: (g, x, y, weightKg) => drawSilverTrevally(g, x, y, 0.82 * sizeScaleFor('silver_trevally', weightKg)),
  grey_morwong: (g, x, y, weightKg) => drawGreyMorwong(g, x, y, 0.85 * sizeScaleFor('grey_morwong', weightKg)),
  jackass_morwong: (g, x, y, weightKg) => drawJackassMorwong(g, x, y, 0.85 * sizeScaleFor('jackass_morwong', weightKg)),
  blue_groper: (g, x, y, weightKg) => drawBlueGroper(g, x, y, 0.75 * sizeScaleFor('blue_groper', weightKg)),
  bonito: (g, x, y, weightKg) => drawBonito(g, x, y, 0.8 * sizeScaleFor('bonito', weightKg)),
  cobia: (g, x, y, weightKg) => drawCobia(g, x, y, 0.62 * sizeScaleFor('cobia', weightKg)),
  dusky_flathead: (g, x, y, weightKg) => drawDuskyFlathead(g, x, y, 0.95 * sizeScaleFor('dusky_flathead', weightKg)),
  tiger_flathead: (g, x, y, weightKg) => drawTigerFlathead(g, x, y, 0.98 * sizeScaleFor('tiger_flathead', weightKg)),
  bluespotted_flathead: (g, x, y, weightKg) => drawBluespottedFlathead(g, x, y, 1.0 * sizeScaleFor('bluespotted_flathead', weightKg)),
  sand_flathead: (g, x, y, weightKg) => drawSandFlathead(g, x, y, 1.05 * sizeScaleFor('sand_flathead', weightKg)),
  rock_flathead: (g, x, y, weightKg) => drawRockFlathead(g, x, y, 0.98 * sizeScaleFor('rock_flathead', weightKg)),
  flounder: (g, x, y, weightKg) => drawFlounder(g, x, y, 0.85 * sizeScaleFor('flounder', weightKg)),
  australian_salmon: (g, x, y, weightKg) => drawAustralianSalmon(g, x, y, 0.9 * sizeScaleFor('australian_salmon', weightKg)),
  australian_herring: (g, x, y, weightKg) => drawAustralianHerring(g, x, y, 1.2 * sizeScaleFor('australian_herring', weightKg)),
  albacore: (g, x, y, weightKg) => drawAlbacore(g, x, y, 0.75 * sizeScaleFor('albacore', weightKg)),
  amberjack: (g, x, y, weightKg) => drawAmberjack(g, x, y, 0.75 * sizeScaleFor('amberjack', weightKg)),
  barramundi: (g, x, y, weightKg) => drawBarramundi(g, x, y, 0.72 * sizeScaleFor('barramundi', weightKg)),
  black_bream: (g, x, y, weightKg) => drawBlackBream(g, x, y, 0.9 * sizeScaleFor('black_bream', weightKg)),
  yellowfin_bream: (g, x, y, weightKg) => drawYellowfinBream(g, x, y, 0.9 * sizeScaleFor('yellowfin_bream', weightKg)),
  tarwhine: (g, x, y, weightKg) => drawTarwhine(g, x, y, 0.95 * sizeScaleFor('tarwhine', weightKg)),
  black_jewfish: (g, x, y, weightKg) => drawBlackJewfish(g, x, y, 0.68 * sizeScaleFor('black_jewfish', weightKg)),
  blue_eye_trevalla: (g, x, y, weightKg) => drawBlueEyeTrevalla(g, x, y, 0.78 * sizeScaleFor('blue_eye_trevalla', weightKg)),
  mullet: (g, x, y, weightKg) => drawMullet(g, x, y, 0.95 * sizeScaleFor('mullet', weightKg)),
  bream: (g, x, y, weightKg) => drawBream(g, x, y, 0.9 * sizeScaleFor('bream', weightKg)),
  tuna: (g, x, y, weightKg) => drawTuna(g, x, y, 0.75 * sizeScaleFor('tuna', weightKg)),
  spotted_mackerel: (g, x, y, weightKg) => drawSpottedMackerel(g, x, y, 0.82 * sizeScaleFor('spotted_mackerel', weightKg)),
  tailor: (g, x, y, weightKg) => drawTailor(g, x, y, 0.95 * sizeScaleFor('tailor', weightKg)),
  trevally: (g, x, y, weightKg) => drawTrevally(g, x, y, 0.85 * sizeScaleFor('trevally', weightKg)),
  kingfish: (g, x, y, weightKg) => drawKingfish(g, x, y, 0.78 * sizeScaleFor('kingfish', weightKg)),
  whiting: (g, x, y, weightKg) => drawWhiting(g, x, y, 1.1 * sizeScaleFor('whiting', weightKg)),
  coral_trout: (g, x, y, weightKg) => drawCoralTrout(g, x, y, 0.85 * sizeScaleFor('coral_trout', weightKg)),
  angler_fish: (g, x, y, weightKg) => drawAngler(g, x, y, 0.95 * sizeScaleFor('angler_fish', weightKg)),
  great_white: (g, x, y, weightKg) => drawGreatWhite(g, x, y, 0.62 * sizeScaleFor('great_white', weightKg)),
  tiger_shark: (g, x, y, weightKg) => drawTigerShark(g, x, y, 0.65 * sizeScaleFor('tiger_shark', weightKg)),
  bull_shark: (g, x, y, weightKg) => drawBullShark(g, x, y, 0.68 * sizeScaleFor('bull_shark', weightKg)),
  // Much smaller base multiplier than the other sharks - the drawer itself
  // is built at a far larger native scale (that towering dorsal fin), so
  // this keeps a caught one from blowing out the row instead of just
  // looking bigger like the other legendary catches do.
  megalodon: (g, x, y, weightKg) => drawMegalodon(g, x, y, 0.35 * sizeScaleFor('megalodon', weightKg)),
  old_boot: (g, x, y, weightKg) => drawOldBoot(g, x, y, 1.3 * sizeScaleFor('old_boot', weightKg))
};

// Icon drawer for each stackable bait item in the Buy screen (see BAIT in
// baitData.js) - unlike CATCH_DRAWERS these take no weight, since bait
// units are all identical.
const BAIT_ICON_DRAWERS = {
  prawn: (g, x, y) => drawPrawn(g, x, y, 1.7),
  squid: (g, x, y) => drawSquid(g, x, y, 1.7)
};

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data) {
    this.mode = (data && data.mode) || 'menu';
    this.pendingFlash = (data && data.flash) || null;
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;

    this.add.rectangle(0, 0, width, height, 0x0e3f5c).setOrigin(0, 0);
    this.statusBar = addStatusBar(this, GameState);
    createIconButton(this, width - 40, 92, 22, drawCloseIcon, () => this.scene.start('OceanScene'));

    if (this.mode === 'buy') {
      this.buildBuy(width, height);
    } else if (this.mode === 'sell') {
      this.buildSell(width, height);
    } else if (this.mode === 'upgrades') {
      this.buildUpgrades(width, height);
    } else {
      this.buildMenu(width, height);
    }
  }

  // The landing view - three doors in: buy bait, sell the day's catch, or
  // upgrade the line to reach deeper water.
  buildMenu(width, height) {
    this.add.text(width / 2, 98, 'Bait & Tackle Shop', heading('30px')).setOrigin(0.5);
    this.add.text(width / 2, 130, 'What are you here for?', subheading('16px')).setOrigin(0.5);

    createBubbleButton(this, width / 2 - 170, 280, 190, 90, 'Buy', () => this.scene.restart({ mode: 'buy' }), {
      fontSize: '24px'
    });
    createBubbleButton(this, width / 2, 280, 190, 90, 'Sell', () => this.scene.restart({ mode: 'sell' }), {
      fontSize: '24px'
    });
    createBubbleButton(
      this,
      width / 2 + 170,
      280,
      190,
      90,
      'Upgrades',
      () => this.scene.restart({ mode: 'upgrades' }),
      { fontSize: '20px' }
    );

    createBubbleButton(
      this,
      width / 2,
      height - 90,
      220,
      56,
      'Back to Ocean',
      () => {
        this.scene.start('OceanScene');
      },
      { fontSize: '20px' }
    );
  }

  buildBuy(width, height) {
    this.add.text(width / 2, 98, 'Buy Bait', heading('30px')).setOrigin(0.5);

    this.messageText = this.add
      .text(width / 2, height - 164, '', subheading('18px', { color: '#ffe17d' }))
      .setOrigin(0.5);

    BAIT.forEach((bait, i) => this.buildBaitRow(bait, 200 + i * 110));

    this.buildBackButton(width, height);
  }

  buildBaitRow(bait, y) {
    const width = DESIGN_WIDTH;
    this.add.rectangle(width / 2, y, 460, 100, 0x145a73).setStrokeStyle(2, 0x0c3446);
    const icon = this.add.graphics();
    const drawer = BAIT_ICON_DRAWERS[bait.id];
    if (drawer) drawer(icon, width / 2 - 175, y);
    this.add.text(width / 2 - 120, y - 18, bait.name, label('20px')).setOrigin(0, 0.5);
    this.add
      .text(width / 2 - 120, y + 12, `${bait.packSize} for $${bait.cost}`, label('15px', { color: '#bfe9ff' }))
      .setOrigin(0, 0.5);
    createBubbleButton(this, width / 2 + 155, y, 120, 50, 'Buy', () => this.buyBait(bait), { fontSize: '18px' });
  }

  buildSell(width, height) {
    this.add.text(width / 2, 98, 'Sell Your Catch', heading('30px')).setOrigin(0.5);

    this.messageText = this.add
      .text(width / 2, height - 164, '', subheading('18px', { color: '#ffe17d' }))
      .setOrigin(0.5);

    const catches = GameState.data.catches;
    if (catches.length === 0) {
      this.add
        .text(width / 2, 260, "Nothing to sell yet.\nGo catch something!", { ...subheading('17px'), align: 'center' })
        .setOrigin(0.5);
    } else {
      // List state lives on the scene instance (not restarted per
      // keystroke) so the list can re-filter live without the search box
      // losing keyboard focus the way a full this.scene.restart() would.
      this.listContainer = null;
      this.listMaskGraphics = null;
      this.scrollHintText = null;
      this.emptyResultsText = null;
      this.scroll = 0;
      this.maxScroll = 0;
      this.listViewTop = 178;
      this.listViewBottom = height - 128;

      this.searchBox = createSearchBox(this, width / 2, 140, 380, {
        placeholder: 'Search your catch...',
        onChange: () => this.refreshSellList(width, height)
      });

      this.input.on('wheel', (pointer, over, dx, dy) => {
        if (this.maxScroll <= 0 || !this.listContainer) return;
        this.scroll = Phaser.Math.Clamp(this.scroll - dy * 0.5, -this.maxScroll, 0);
        this.listContainer.y = this.listViewTop + this.scroll;
      });

      this.refreshSellList(width, height);
    }

    this.buildBackButton(width, height);

    if (this.pendingFlash) this.flashMessage(this.pendingFlash);
  }

  // Rebuilds just the catch-row list (and its scroll state) in place -
  // called on every keystroke, so it deliberately never touches the search
  // box itself or restarts the scene.
  refreshSellList(width, height) {
    if (this.listContainer) {
      this.listContainer.destroy();
      this.listContainer = null;
    }
    if (this.emptyResultsText) {
      this.emptyResultsText.destroy();
      this.emptyResultsText = null;
    }

    const query = this.searchBox.getValue().trim().toLowerCase();
    const filtered = query
      ? GameState.data.catches.filter((c) => getCatchable(c.itemId).name.toLowerCase().includes(query))
      : GameState.data.catches;

    if (filtered.length === 0) {
      if (this.listMaskGraphics) {
        this.listMaskGraphics.destroy();
        this.listMaskGraphics = null;
      }
      if (this.scrollHintText) this.scrollHintText.setVisible(false);
      this.maxScroll = 0;
      this.emptyResultsText = this.add
        .text(width / 2, (this.listViewTop + this.listViewBottom) / 2, `No catch matches "${this.searchBox.getValue()}"`, {
          ...subheading('16px', { color: '#bfe9ff' }),
          align: 'center'
        })
        .setOrigin(0.5);
      return;
    }

    this.buildCatchList(filtered, width, height);
  }

  buildUpgrades(width, height) {
    this.add.text(width / 2, 98, 'Line Upgrades', heading('30px')).setOrigin(0.5);

    this.messageText = this.add
      .text(width / 2, height - 164, '', subheading('18px', { color: '#ffe17d' }))
      .setOrigin(0.5);

    const count = GameState.lineLengthTier;
    const current = currentUpgrade(count);
    const next = nextUpgrade(count);

    this.add
      .text(width / 2, 175, `Current reach: ${Math.round(current.maxDepth / 12)}m deep`, subheading('17px'))
      .setOrigin(0.5);
    this.add
      .text(width / 2, 205, `${count} upgrade${count === 1 ? '' : 's'} bought so far`, label('14px', { color: '#7fa8bd' }))
      .setOrigin(0.5);

    const panelY = 280;
    this.add.rectangle(width / 2, panelY, 460, 110, 0x145a73).setStrokeStyle(2, 0x0c3446);
    this.add.text(width / 2, panelY - 22, 'Longer Line', label('20px')).setOrigin(0.5);
    this.add
      .text(width / 2, panelY + 8, `Reach ${Math.round(next.maxDepth / 12)}m deep`, label('15px', { color: '#bfe9ff' }))
      .setOrigin(0.5);
    const buyBtn = createBubbleButton(
      this,
      width / 2,
      panelY + 42,
      160,
      44,
      `Buy - $${next.cost}`,
      () => this.buyUpgrade(next.cost),
      { fontSize: '15px' }
    );
    if (GameState.coins < next.cost) buyBtn.setEnabled(false);

    this.buildBackButton(width, height);

    if (this.pendingFlash) this.flashMessage(this.pendingFlash);
  }

  // The catch list can run well past what fits on screen (every catch is
  // its own row, and there's no cap on how many you can be holding), so it
  // sits in its own container clipped to a fixed viewport and scrolled with
  // the mouse wheel - rather than rows silently overflowing past the back
  // button with no way to reach them. Scroll state and the wheel listener
  // itself live on the scene (set up once in buildSell) so repeated calls
  // here - one per search keystroke - don't stack up duplicate listeners.
  buildCatchList(catches, width, height) {
    const rowHeight = 82;
    const viewTop = this.listViewTop;
    const viewBottom = this.listViewBottom;
    const viewHeight = viewBottom - viewTop;
    const contentHeight = catches.length * rowHeight;
    this.maxScroll = Math.max(0, contentHeight - viewHeight);
    this.scroll = Phaser.Math.Clamp(this.scroll, -this.maxScroll, 0);

    const listContainer = this.add.container(0, viewTop + this.scroll);
    catches.forEach((c, i) => this.buildCatchRow(c, 41 + i * rowHeight, listContainer));
    this.listContainer = listContainer;

    if (this.listMaskGraphics) {
      this.listMaskGraphics.destroy();
      this.listMaskGraphics = null;
    }

    if (this.maxScroll <= 0) {
      if (this.scrollHintText) this.scrollHintText.setVisible(false);
      return;
    }

    this.listMaskGraphics = this.make.graphics().fillStyle(0xffffff).fillRect(0, viewTop, width, viewHeight);
    listContainer.setMask(this.listMaskGraphics.createGeometryMask());

    // A small fading hint so it's obvious there's more to see below,
    // without needing a full scrollbar widget - built once and toggled
    // rather than re-added on every search keystroke.
    if (!this.scrollHintText) {
      this.scrollHintText = this.add
        .text(width / 2, viewBottom + 14, '↓ scroll for more ↓', label('12px', { color: '#7fa8bd' }))
        .setOrigin(0.5);
    }
    this.scrollHintText.setVisible(true);
  }

  buildCatchRow(c, y, container) {
    const width = DESIGN_WIDTH;
    const info = getCatchable(c.itemId);
    const draw = CATCH_DRAWERS[c.itemId];

    const bg = this.add.rectangle(width / 2, y, 460, 72, 0x145a73).setStrokeStyle(2, 0x0c3446);
    const icon = this.add.graphics();
    if (draw) draw(icon, width / 2 - 175, y, c.weightKg);
    const nameText = this.add.text(width / 2 - 120, y - 12, info.name, label('17px')).setOrigin(0, 0.5);
    const weightText = this.add
      .text(width / 2 - 120, y + 12, `${c.weightKg}kg`, label('13px', { color: '#bfe9ff' }))
      .setOrigin(0, 0.5);

    // Added to the container before the button below, so the row panel
    // renders underneath it - added the other way round, the opaque panel
    // painted on top would bury the Sell button, making it unclickable.
    if (container) container.add([bg, icon, nameText, weightText]);

    createBubbleButton(this, width / 2 + 155, y, 120, 46, `Sell +$${c.value}`, () => this.sellCatch(c.uid), {
      fontSize: '14px',
      container
    });
  }

  buildBackButton(width, height) {
    createBubbleButton(
      this,
      width / 2,
      height - 90,
      220,
      56,
      'Back',
      () => {
        this.scene.restart({ mode: 'menu' });
      },
      { fontSize: '20px' }
    );
  }

  buyBait(bait) {
    if (GameState.spendCoins(bait.cost)) {
      GameState.addItem(bait.id, bait.packSize);
      this.statusBar.refresh();
      this.flashMessage(`Bought ${bait.packSize} ${bait.name}!`);
    } else {
      this.flashMessage('Not enough coins!');
    }
  }

  buyUpgrade(cost) {
    if (!GameState.buyLineUpgrade(cost)) {
      this.flashMessage('Not enough coins!');
      return;
    }
    this.statusBar.refresh();
    this.scene.restart({ mode: 'upgrades', flash: 'Line upgraded!' });
  }

  sellCatch(uid) {
    const catchInfo = GameState.data.catches.find((c) => c.uid === uid);
    const name = catchInfo ? getCatchable(catchInfo.itemId).name : 'catch';
    const earned = GameState.sellCatch(uid);
    if (earned <= 0) return;
    // Simplest reliable refresh after a sale - rebuild the sell list so the
    // sold row is gone and the rest shift up.
    this.scene.restart({ mode: 'sell', flash: `Sold ${name} for $${earned}!` });
  }

  flashMessage(text) {
    this.messageText.setText(text);
    this.time.delayedCall(1400, () => this.messageText.setText(''));
  }
}
