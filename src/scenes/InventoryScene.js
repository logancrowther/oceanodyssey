import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { BAIT } from '../data/baitData.js';
import { getCatchable, sizeScaleFor, rarityColorFor, rarityLabelFor } from '../data/catchables.js';
import { createBubbleButton } from '../ui/BubbleButton.js';
import { createIconButton, drawCloseIcon } from '../ui/iconButton.js';
import { createSearchBox } from '../ui/SearchBox.js';
import { addStatusBar } from '../ui/fishIcon.js';
import {
  drawPrawn,
  drawSquid,
  drawPlasticLure,
  drawAbyssalBait,
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
  drawDragonfish,
  drawGreatWhite,
  drawTigerShark,
  drawBullShark,
  drawMegalodon,
  drawHumpbackWhale,
  drawOldBoot
} from '../ui/tackle.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { heading, subheading, label } from '../ui/textStyle.js';

const COLS = 3;
const CELL_W = 225;
const CELL_H = 148;
const VIEWPORT_TOP = 165;
const VIEWPORT_BOTTOM_MARGIN = 24;
const SCROLL_SPEED = 0.6;

// Base icon scale for an average-sized one of each - shrunk to match the
// smaller grid cells - a specific catch's actual weight then grows or
// shrinks it further from there.
export const CATCH_DRAWERS = {
  flathead: (g, x, y, weightKg) => drawFlathead(g, x, y, 0.85 * sizeScaleFor('flathead', weightKg)),
  red_morwong: (g, x, y, weightKg) => drawRedMorwong(g, x, y, 0.72 * sizeScaleFor('red_morwong', weightKg)),
  banded_morwong: (g, x, y, weightKg) => drawBandedMorwong(g, x, y, 0.7 * sizeScaleFor('banded_morwong', weightKg)),
  blue_morwong: (g, x, y, weightKg) => drawBlueMorwong(g, x, y, 0.66 * sizeScaleFor('blue_morwong', weightKg)),
  hairtail: (g, x, y, weightKg) => drawHairtail(g, x, y, 0.42 * sizeScaleFor('hairtail', weightKg)),
  hapuku: (g, x, y, weightKg) => drawHapuku(g, x, y, 0.48 * sizeScaleFor('hapuku', weightKg)),
  leatherjacket: (g, x, y, weightKg) => drawLeatherjacket(g, x, y, 0.98 * sizeScaleFor('leatherjacket', weightKg)),
  longtail_tuna: (g, x, y, weightKg) => drawLongtailTuna(g, x, y, 0.6 * sizeScaleFor('longtail_tuna', weightKg)),
  yellowfin_tuna: (g, x, y, weightKg) => drawYellowfinTuna(g, x, y, 0.56 * sizeScaleFor('yellowfin_tuna', weightKg)),
  southern_bluefin_tuna: (g, x, y, weightKg) =>
    drawSouthernBluefinTuna(g, x, y, 0.6 * sizeScaleFor('southern_bluefin_tuna', weightKg)),
  bigeye_tuna: (g, x, y, weightKg) => drawBigeyeTuna(g, x, y, 0.58 * sizeScaleFor('bigeye_tuna', weightKg)),
  skipjack_tuna: (g, x, y, weightKg) => drawSkipjackTuna(g, x, y, 0.7 * sizeScaleFor('skipjack_tuna', weightKg)),
  blackfin_tuna: (g, x, y, weightKg) => drawBlackfinTuna(g, x, y, 0.66 * sizeScaleFor('blackfin_tuna', weightKg)),
  dogtooth_tuna: (g, x, y, weightKg) => drawDogtoothTuna(g, x, y, 0.56 * sizeScaleFor('dogtooth_tuna', weightKg)),
  luderick: (g, x, y, weightKg) => drawLuderick(g, x, y, 0.78 * sizeScaleFor('luderick', weightKg)),
  spanish_mackerel: (g, x, y, weightKg) => drawSpanishMackerel(g, x, y, 0.5 * sizeScaleFor('spanish_mackerel', weightKg)),
  school_mackerel: (g, x, y, weightKg) => drawSchoolMackerel(g, x, y, 0.7 * sizeScaleFor('school_mackerel', weightKg)),
  king_mackerel: (g, x, y, weightKg) => drawKingMackerel(g, x, y, 0.54 * sizeScaleFor('king_mackerel', weightKg)),
  mahi_mahi: (g, x, y, weightKg) => drawMahiMahi(g, x, y, 0.54 * sizeScaleFor('mahi_mahi', weightKg)),
  mangrove_jack: (g, x, y, weightKg) => drawMangroveJack(g, x, y, 0.7 * sizeScaleFor('mangrove_jack', weightKg)),
  black_marlin: (g, x, y, weightKg) => drawBlackMarlin(g, x, y, 0.34 * sizeScaleFor('black_marlin', weightKg)),
  blue_marlin: (g, x, y, weightKg) => drawBlueMarlin(g, x, y, 0.3 * sizeScaleFor('blue_marlin', weightKg)),
  striped_marlin: (g, x, y, weightKg) => drawStripedMarlin(g, x, y, 0.36 * sizeScaleFor('striped_marlin', weightKg)),
  white_marlin: (g, x, y, weightKg) => drawWhiteMarlin(g, x, y, 0.46 * sizeScaleFor('white_marlin', weightKg)),
  moses_perch: (g, x, y, weightKg) => drawMosesPerch(g, x, y, 0.82 * sizeScaleFor('moses_perch', weightKg)),
  mulloway: (g, x, y, weightKg) => drawMulloway(g, x, y, 0.5 * sizeScaleFor('mulloway', weightKg)),
  pearl_perch: (g, x, y, weightKg) => drawPearlPerch(g, x, y, 0.7 * sizeScaleFor('pearl_perch', weightKg)),
  pink_snapper: (g, x, y, weightKg) => drawPinkSnapper(g, x, y, 0.64 * sizeScaleFor('pink_snapper', weightKg)),
  red_snapper: (g, x, y, weightKg) => drawRedSnapper(g, x, y, 0.64 * sizeScaleFor('red_snapper', weightKg)),
  mangrove_snapper: (g, x, y, weightKg) => drawMangroveSnapper(g, x, y, 0.64 * sizeScaleFor('mangrove_snapper', weightKg)),
  vermilion_snapper: (g, x, y, weightKg) => drawVermilionSnapper(g, x, y, 0.7 * sizeScaleFor('vermilion_snapper', weightKg)),
  silk_snapper: (g, x, y, weightKg) => drawSilkSnapper(g, x, y, 0.64 * sizeScaleFor('silk_snapper', weightKg)),
  queenfish: (g, x, y, weightKg) => drawQueenfish(g, x, y, 0.56 * sizeScaleFor('queenfish', weightKg)),
  red_emperor: (g, x, y, weightKg) => drawRedEmperor(g, x, y, 0.6 * sizeScaleFor('red_emperor', weightKg)),
  crimson_snapper: (g, x, y, weightKg) => drawCrimsonSnapper(g, x, y, 0.64 * sizeScaleFor('crimson_snapper', weightKg)),
  fingermark: (g, x, y, weightKg) => drawFingermark(g, x, y, 0.6 * sizeScaleFor('fingermark', weightKg)),
  nannygai: (g, x, y, weightKg) => drawNannygai(g, x, y, 0.74 * sizeScaleFor('nannygai', weightKg)),
  sailfish: (g, x, y, weightKg) => drawSailfish(g, x, y, 0.42 * sizeScaleFor('sailfish', weightKg)),
  samsonfish: (g, x, y, weightKg) => drawSamsonfish(g, x, y, 0.64 * sizeScaleFor('samsonfish', weightKg)),
  sand_whiting: (g, x, y, weightKg) => drawSandWhiting(g, x, y, 0.88 * sizeScaleFor('sand_whiting', weightKg)),
  school_whiting: (g, x, y, weightKg) => drawSchoolWhiting(g, x, y, 1.1 * sizeScaleFor('school_whiting', weightKg)),
  king_george_whiting: (g, x, y, weightKg) => drawKingGeorgeWhiting(g, x, y, 0.88 * sizeScaleFor('king_george_whiting', weightKg)),
  yellowfin_whiting: (g, x, y, weightKg) => drawYellowfinWhiting(g, x, y, 0.96 * sizeScaleFor('yellowfin_whiting', weightKg)),
  trumpeter_whiting: (g, x, y, weightKg) => drawTrumpeterWhiting(g, x, y, 0.96 * sizeScaleFor('trumpeter_whiting', weightKg)),
  snook: (g, x, y, weightKg) => drawSnook(g, x, y, 0.7 * sizeScaleFor('snook', weightKg)),
  teraglin: (g, x, y, weightKg) => drawTeraglin(g, x, y, 0.72 * sizeScaleFor('teraglin', weightKg)),
  wahoo: (g, x, y, weightKg) => drawWahoo(g, x, y, 0.48 * sizeScaleFor('wahoo', weightKg)),
  dhufish: (g, x, y, weightKg) => drawDhufish(g, x, y, 0.58 * sizeScaleFor('dhufish', weightKg)),
  baldchin_groper: (g, x, y, weightKg) => drawBaldchinGroper(g, x, y, 0.66 * sizeScaleFor('baldchin_groper', weightKg)),
  tuskfish: (g, x, y, weightKg) => drawTuskfish(g, x, y, 0.7 * sizeScaleFor('tuskfish', weightKg)),
  blackspot_tuskfish: (g, x, y, weightKg) => drawBlackspotTuskfish(g, x, y, 0.68 * sizeScaleFor('blackspot_tuskfish', weightKg)),
  blue_tuskfish: (g, x, y, weightKg) => drawBlueTuskfish(g, x, y, 0.68 * sizeScaleFor('blue_tuskfish', weightKg)),
  black_sea_bass: (g, x, y, weightKg) => drawBlackSeaBass(g, x, y, 0.64 * sizeScaleFor('black_sea_bass', weightKg)),
  gag_grouper: (g, x, y, weightKg) => drawGagGrouper(g, x, y, 0.56 * sizeScaleFor('gag_grouper', weightKg)),
  red_grouper: (g, x, y, weightKg) => drawRedGrouper(g, x, y, 0.58 * sizeScaleFor('red_grouper', weightKg)),
  black_grouper: (g, x, y, weightKg) => drawBlackGrouper(g, x, y, 0.56 * sizeScaleFor('black_grouper', weightKg)),
  scamp: (g, x, y, weightKg) => drawScamp(g, x, y, 0.64 * sizeScaleFor('scamp', weightKg)),
  warsaw_grouper: (g, x, y, weightKg) => drawWarsawGrouper(g, x, y, 0.48 * sizeScaleFor('warsaw_grouper', weightKg)),
  red_drum: (g, x, y, weightKg) => drawRedDrum(g, x, y, 0.62 * sizeScaleFor('red_drum', weightKg)),
  black_drum: (g, x, y, weightKg) => drawBlackDrum(g, x, y, 0.54 * sizeScaleFor('black_drum', weightKg)),
  spotted_seatrout: (g, x, y, weightKg) => drawSpottedSeatrout(g, x, y, 0.68 * sizeScaleFor('spotted_seatrout', weightKg)),
  weakfish: (g, x, y, weightKg) => drawWeakfish(g, x, y, 0.66 * sizeScaleFor('weakfish', weightKg)),
  tarpon: (g, x, y, weightKg) => drawTarpon(g, x, y, 0.5 * sizeScaleFor('tarpon', weightKg)),
  bonefish: (g, x, y, weightKg) => drawBonefish(g, x, y, 0.66 * sizeScaleFor('bonefish', weightKg)),
  permit: (g, x, y, weightKg) => drawPermit(g, x, y, 0.56 * sizeScaleFor('permit', weightKg)),
  striped_bass: (g, x, y, weightKg) => drawStripedBass(g, x, y, 0.62 * sizeScaleFor('striped_bass', weightKg)),
  sheepshead: (g, x, y, weightKg) => drawSheepshead(g, x, y, 0.64 * sizeScaleFor('sheepshead', weightKg)),
  hogfish: (g, x, y, weightKg) => drawHogfish(g, x, y, 0.62 * sizeScaleFor('hogfish', weightKg)),
  florida_pompano: (g, x, y, weightKg) => drawFloridaPompano(g, x, y, 0.7 * sizeScaleFor('florida_pompano', weightKg)),
  crevalle_jack: (g, x, y, weightKg) => drawCrevalleJack(g, x, y, 0.56 * sizeScaleFor('crevalle_jack', weightKg)),
  ladyfish: (g, x, y, weightKg) => drawLadyfish(g, x, y, 0.74 * sizeScaleFor('ladyfish', weightKg)),
  tripletail: (g, x, y, weightKg) => drawTripletail(g, x, y, 0.7 * sizeScaleFor('tripletail', weightKg)),
  atlantic_croaker: (g, x, y, weightKg) => drawAtlanticCroaker(g, x, y, 0.86 * sizeScaleFor('atlantic_croaker', weightKg)),
  spot: (g, x, y, weightKg) => drawSpot(g, x, y, 1.1 * sizeScaleFor('spot', weightKg)),
  pigfish: (g, x, y, weightKg) => drawPigfish(g, x, y, 0.86 * sizeScaleFor('pigfish', weightKg)),
  white_grunt: (g, x, y, weightKg) => drawWhiteGrunt(g, x, y, 0.8 * sizeScaleFor('white_grunt', weightKg)),
  red_porgy: (g, x, y, weightKg) => drawRedPorgy(g, x, y, 0.7 * sizeScaleFor('red_porgy', weightKg)),
  scup: (g, x, y, weightKg) => drawScup(g, x, y, 0.9 * sizeScaleFor('scup', weightKg)),
  tautog: (g, x, y, weightKg) => drawTautog(g, x, y, 0.68 * sizeScaleFor('tautog', weightKg)),
  golden_tilefish: (g, x, y, weightKg) => drawGoldenTilefish(g, x, y, 0.58 * sizeScaleFor('golden_tilefish', weightKg)),
  blueline_tilefish: (g, x, y, weightKg) => drawBlueLineTilefish(g, x, y, 0.68 * sizeScaleFor('blueline_tilefish', weightKg)),
  atlantic_mackerel: (g, x, y, weightKg) => drawAtlanticMackerel(g, x, y, 0.78 * sizeScaleFor('atlantic_mackerel', weightKg)),
  cero_mackerel: (g, x, y, weightKg) => drawCeroMackerel(g, x, y, 0.58 * sizeScaleFor('cero_mackerel', weightKg)),
  little_tunny: (g, x, y, weightKg) => drawLittleTunny(g, x, y, 0.66 * sizeScaleFor('little_tunny', weightKg)),
  atlantic_bonito: (g, x, y, weightKg) => drawAtlanticBonito(g, x, y, 0.58 * sizeScaleFor('atlantic_bonito', weightKg)),
  shortfin_mako: (g, x, y, weightKg) => drawShortfinMako(g, x, y, 0.44 * sizeScaleFor('shortfin_mako', weightKg)),
  whaler_shark: (g, x, y, weightKg) => drawWhalerShark(g, x, y, 0.4 * sizeScaleFor('whaler_shark', weightKg)),
  bronze_whaler: (g, x, y, weightKg) => drawBronzeWhaler(g, x, y, 0.42 * sizeScaleFor('bronze_whaler', weightKg)),
  dusky_shark: (g, x, y, weightKg) => drawDuskyShark(g, x, y, 0.46 * sizeScaleFor('dusky_shark', weightKg)),
  blacktip_shark: (g, x, y, weightKg) => drawBlacktipShark(g, x, y, 0.36 * sizeScaleFor('blacktip_shark', weightKg)),
  spinner_shark: (g, x, y, weightKg) => drawSpinnerShark(g, x, y, 0.37 * sizeScaleFor('spinner_shark', weightKg)),
  hammerhead: (g, x, y, weightKg) => drawHammerhead(g, x, y, 0.42 * sizeScaleFor('hammerhead', weightKg)),
  scalloped_hammerhead: (g, x, y, weightKg) => drawScallopedHammerhead(g, x, y, 0.43 * sizeScaleFor('scalloped_hammerhead', weightKg)),
  great_hammerhead: (g, x, y, weightKg) => drawGreatHammerhead(g, x, y, 0.52 * sizeScaleFor('great_hammerhead', weightKg)),
  wobbegong: (g, x, y, weightKg) => drawWobbegong(g, x, y, 0.58 * sizeScaleFor('wobbegong', weightKg)),
  ornate_wobbegong: (g, x, y, weightKg) => drawOrnateWobbegong(g, x, y, 0.6 * sizeScaleFor('ornate_wobbegong', weightKg)),
  spotted_wobbegong: (g, x, y, weightKg) => drawSpottedWobbegong(g, x, y, 0.62 * sizeScaleFor('spotted_wobbegong', weightKg)),
  gummy_shark: (g, x, y, weightKg) => drawGummyShark(g, x, y, 0.5 * sizeScaleFor('gummy_shark', weightKg)),
  school_shark: (g, x, y, weightKg) => drawSchoolShark(g, x, y, 0.48 * sizeScaleFor('school_shark', weightKg)),
  blue_shark: (g, x, y, weightKg) => drawBlueShark(g, x, y, 0.43 * sizeScaleFor('blue_shark', weightKg)),
  spiny_dogfish: (g, x, y, weightKg) => drawSpinyDogfish(g, x, y, 0.78 * sizeScaleFor('spiny_dogfish', weightKg)),
  smooth_dogfish: (g, x, y, weightKg) => drawSmoothDogfish(g, x, y, 0.8 * sizeScaleFor('smooth_dogfish', weightKg)),
  seven_gilled_shark: (g, x, y, weightKg) => drawSevenGilledShark(g, x, y, 0.46 * sizeScaleFor('seven_gilled_shark', weightKg)),
  six_gilled_shark: (g, x, y, weightKg) => drawSixGilledShark(g, x, y, 0.4 * sizeScaleFor('six_gilled_shark', weightKg)),
  sawshark: (g, x, y, weightKg) => drawSawshark(g, x, y, 0.72 * sizeScaleFor('sawshark', weightKg)),
  thresher_shark: (g, x, y, weightKg) => drawThresherShark(g, x, y, 0.34 * sizeScaleFor('thresher_shark', weightKg)),
  angel_shark: (g, x, y, weightKg) => drawAngelShark(g, x, y, 0.54 * sizeScaleFor('angel_shark', weightKg)),
  nurse_shark: (g, x, y, weightKg) => drawNurseShark(g, x, y, 0.44 * sizeScaleFor('nurse_shark', weightKg)),
  lemon_shark: (g, x, y, weightKg) => drawLemonShark(g, x, y, 0.46 * sizeScaleFor('lemon_shark', weightKg)),
  sandbar_shark: (g, x, y, weightKg) => drawSandbarShark(g, x, y, 0.42 * sizeScaleFor('sandbar_shark', weightKg)),
  blacktip_reef_shark: (g, x, y, weightKg) => drawBlacktipReefShark(g, x, y, 0.58 * sizeScaleFor('blacktip_reef_shark', weightKg)),
  guitarfish: (g, x, y, weightKg) => drawGuitarfish(g, x, y, 0.5 * sizeScaleFor('guitarfish', weightKg)),
  shovelnose_ray: (g, x, y, weightKg) => drawShovelnoseRay(g, x, y, 0.5 * sizeScaleFor('shovelnose_ray', weightKg)),
  eagle_ray: (g, x, y, weightKg) => drawEagleRay(g, x, y, 0.48 * sizeScaleFor('eagle_ray', weightKg)),
  manta_ray: (g, x, y, weightKg) => drawMantaRay(g, x, y, 0.34 * sizeScaleFor('manta_ray', weightKg)),
  devil_ray: (g, x, y, weightKg) => drawDevilRay(g, x, y, 0.46 * sizeScaleFor('devil_ray', weightKg)),
  stingray: (g, x, y, weightKg) => drawStingray(g, x, y, 0.58 * sizeScaleFor('stingray', weightKg)),
  southern_stingray: (g, x, y, weightKg) => drawSouthernStingray(g, x, y, 0.54 * sizeScaleFor('southern_stingray', weightKg)),
  cownose_ray: (g, x, y, weightKg) => drawCownoseRay(g, x, y, 0.5 * sizeScaleFor('cownose_ray', weightKg)),
  butterfly_ray: (g, x, y, weightKg) => drawButterflyRay(g, x, y, 0.48 * sizeScaleFor('butterfly_ray', weightKg)),
  electric_ray: (g, x, y, weightKg) => drawElectricRay(g, x, y, 0.62 * sizeScaleFor('electric_ray', weightKg)),
  torpedo_ray: (g, x, y, weightKg) => drawTorpedoRay(g, x, y, 0.54 * sizeScaleFor('torpedo_ray', weightKg)),
  banjo_ray: (g, x, y, weightKg) => drawBanjoRay(g, x, y, 0.51 * sizeScaleFor('banjo_ray', weightKg)),
  fiddler_ray: (g, x, y, weightKg) => drawFiddlerRay(g, x, y, 0.51 * sizeScaleFor('fiddler_ray', weightKg)),
  barndoor_skate: (g, x, y, weightKg) => drawBarndoorSkate(g, x, y, 0.54 * sizeScaleFor('barndoor_skate', weightKg)),
  winter_skate: (g, x, y, weightKg) => drawWinterSkate(g, x, y, 0.64 * sizeScaleFor('winter_skate', weightKg)),
  clearnose_skate: (g, x, y, weightKg) => drawClearnoseSkate(g, x, y, 0.68 * sizeScaleFor('clearnose_skate', weightKg)),
  little_skate: (g, x, y, weightKg) => drawLittleSkate(g, x, y, 0.92 * sizeScaleFor('little_skate', weightKg)),
  great_barracuda: (g, x, y, weightKg) => drawGreatBarracuda(g, x, y, 0.54 * sizeScaleFor('great_barracuda', weightKg)),
  pickhandle_barracuda: (g, x, y, weightKg) => drawPickhandleBarracuda(g, x, y, 0.67 * sizeScaleFor('pickhandle_barracuda', weightKg)),
  fat_snook: (g, x, y, weightKg) => drawFatSnook(g, x, y, 0.66 * sizeScaleFor('fat_snook', weightKg)),
  african_pompano: (g, x, y, weightKg) => drawAfricanPompano(g, x, y, 0.62 * sizeScaleFor('african_pompano', weightKg)),
  lookdown: (g, x, y, weightKg) => drawLookdown(g, x, y, 0.88 * sizeScaleFor('lookdown', weightKg)),
  southern_flounder: (g, x, y, weightKg) => drawSouthernFlounder(g, x, y, 0.72 * sizeScaleFor('southern_flounder', weightKg)),
  summer_flounder: (g, x, y, weightKg) => drawSummerFlounder(g, x, y, 0.78 * sizeScaleFor('summer_flounder', weightKg)),
  garfish: (g, x, y, weightKg) => drawGarfish(g, x, y, 0.95 * sizeScaleFor('garfish', weightKg)),
  southern_garfish: (g, x, y, weightKg) => drawSouthernGarfish(g, x, y, 0.95 * sizeScaleFor('southern_garfish', weightKg)),
  gemfish: (g, x, y, weightKg) => drawGemfish(g, x, y, 0.72 * sizeScaleFor('gemfish', weightKg)),
  giant_trevally: (g, x, y, weightKg) => drawGiantTrevally(g, x, y, 0.5 * sizeScaleFor('giant_trevally', weightKg)),
  golden_trevally: (g, x, y, weightKg) => drawGoldenTrevally(g, x, y, 0.66 * sizeScaleFor('golden_trevally', weightKg)),
  silver_trevally: (g, x, y, weightKg) => drawSilverTrevally(g, x, y, 0.7 * sizeScaleFor('silver_trevally', weightKg)),
  grey_morwong: (g, x, y, weightKg) => drawGreyMorwong(g, x, y, 0.72 * sizeScaleFor('grey_morwong', weightKg)),
  jackass_morwong: (g, x, y, weightKg) => drawJackassMorwong(g, x, y, 0.72 * sizeScaleFor('jackass_morwong', weightKg)),
  blue_groper: (g, x, y, weightKg) => drawBlueGroper(g, x, y, 0.65 * sizeScaleFor('blue_groper', weightKg)),
  bonito: (g, x, y, weightKg) => drawBonito(g, x, y, 0.7 * sizeScaleFor('bonito', weightKg)),
  cobia: (g, x, y, weightKg) => drawCobia(g, x, y, 0.52 * sizeScaleFor('cobia', weightKg)),
  dusky_flathead: (g, x, y, weightKg) => drawDuskyFlathead(g, x, y, 0.82 * sizeScaleFor('dusky_flathead', weightKg)),
  tiger_flathead: (g, x, y, weightKg) => drawTigerFlathead(g, x, y, 0.85 * sizeScaleFor('tiger_flathead', weightKg)),
  bluespotted_flathead: (g, x, y, weightKg) => drawBluespottedFlathead(g, x, y, 0.88 * sizeScaleFor('bluespotted_flathead', weightKg)),
  sand_flathead: (g, x, y, weightKg) => drawSandFlathead(g, x, y, 0.92 * sizeScaleFor('sand_flathead', weightKg)),
  rock_flathead: (g, x, y, weightKg) => drawRockFlathead(g, x, y, 0.85 * sizeScaleFor('rock_flathead', weightKg)),
  flounder: (g, x, y, weightKg) => drawFlounder(g, x, y, 0.72 * sizeScaleFor('flounder', weightKg)),
  australian_salmon: (g, x, y, weightKg) => drawAustralianSalmon(g, x, y, 0.78 * sizeScaleFor('australian_salmon', weightKg)),
  australian_herring: (g, x, y, weightKg) => drawAustralianHerring(g, x, y, 1.0 * sizeScaleFor('australian_herring', weightKg)),
  albacore: (g, x, y, weightKg) => drawAlbacore(g, x, y, 0.65 * sizeScaleFor('albacore', weightKg)),
  amberjack: (g, x, y, weightKg) => drawAmberjack(g, x, y, 0.65 * sizeScaleFor('amberjack', weightKg)),
  barramundi: (g, x, y, weightKg) => drawBarramundi(g, x, y, 0.62 * sizeScaleFor('barramundi', weightKg)),
  black_bream: (g, x, y, weightKg) => drawBlackBream(g, x, y, 0.78 * sizeScaleFor('black_bream', weightKg)),
  yellowfin_bream: (g, x, y, weightKg) => drawYellowfinBream(g, x, y, 0.78 * sizeScaleFor('yellowfin_bream', weightKg)),
  tarwhine: (g, x, y, weightKg) => drawTarwhine(g, x, y, 0.82 * sizeScaleFor('tarwhine', weightKg)),
  black_jewfish: (g, x, y, weightKg) => drawBlackJewfish(g, x, y, 0.58 * sizeScaleFor('black_jewfish', weightKg)),
  blue_eye_trevalla: (g, x, y, weightKg) => drawBlueEyeTrevalla(g, x, y, 0.68 * sizeScaleFor('blue_eye_trevalla', weightKg)),
  mullet: (g, x, y, weightKg) => drawMullet(g, x, y, 0.82 * sizeScaleFor('mullet', weightKg)),
  bream: (g, x, y, weightKg) => drawBream(g, x, y, 0.78 * sizeScaleFor('bream', weightKg)),
  tuna: (g, x, y, weightKg) => drawTuna(g, x, y, 0.65 * sizeScaleFor('tuna', weightKg)),
  spotted_mackerel: (g, x, y, weightKg) => drawSpottedMackerel(g, x, y, 0.7 * sizeScaleFor('spotted_mackerel', weightKg)),
  tailor: (g, x, y, weightKg) => drawTailor(g, x, y, 0.82 * sizeScaleFor('tailor', weightKg)),
  trevally: (g, x, y, weightKg) => drawTrevally(g, x, y, 0.72 * sizeScaleFor('trevally', weightKg)),
  kingfish: (g, x, y, weightKg) => drawKingfish(g, x, y, 0.65 * sizeScaleFor('kingfish', weightKg)),
  whiting: (g, x, y, weightKg) => drawWhiting(g, x, y, 0.95 * sizeScaleFor('whiting', weightKg)),
  coral_trout: (g, x, y, weightKg) => drawCoralTrout(g, x, y, 0.7 * sizeScaleFor('coral_trout', weightKg)),
  angler_fish: (g, x, y, weightKg) => drawAngler(g, x, y, 0.78 * sizeScaleFor('angler_fish', weightKg)),
  dragonfish: (g, x, y, weightKg) => drawDragonfish(g, x, y, 0.62 * sizeScaleFor('dragonfish', weightKg)),
  great_white: (g, x, y, weightKg) => drawGreatWhite(g, x, y, 0.54 * sizeScaleFor('great_white', weightKg)),
  tiger_shark: (g, x, y, weightKg) => drawTigerShark(g, x, y, 0.56 * sizeScaleFor('tiger_shark', weightKg)),
  bull_shark: (g, x, y, weightKg) => drawBullShark(g, x, y, 0.58 * sizeScaleFor('bull_shark', weightKg)),
  megalodon: (g, x, y, weightKg) => drawMegalodon(g, x, y, 0.3 * sizeScaleFor('megalodon', weightKg)),
  humpback_whale: (g, x, y, weightKg) => drawHumpbackWhale(g, x, y, 0.26 * sizeScaleFor('humpback_whale', weightKg)),
  old_boot: (g, x, y, weightKg) => drawOldBoot(g, x, y, 1.1 * sizeScaleFor('old_boot', weightKg))
};

// Icon drawer for each stackable bait item (see BAIT in baitData.js).
const BAIT_ICON_DRAWERS = {
  prawn: (g, x, y) => drawPrawn(g, x, y, 1.3),
  squid: (g, x, y) => drawSquid(g, x, y, 1.3),
  plastic_lure: (g, x, y) => drawPlasticLure(g, x, y, 2.2),
  abyssal_bait: (g, x, y) => drawAbyssalBait(g, x, y, 2.6)
};

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super('InventoryScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    this.cells = [];
    this.maxScroll = 0;
    this.sortByValue = false;

    this.add.rectangle(0, 0, width, height, 0x0e3f5c).setOrigin(0, 0);
    this.add.text(width / 2, 68, 'Inventory', heading('28px')).setOrigin(0.5);
    this.add
      .text(width / 2, 90, 'Equip bait to load it on your hook', subheading('14px'))
      .setOrigin(0.5);

    this.statusBar = addStatusBar(this, GameState);
    createIconButton(this, width - 40, 92, 22, drawCloseIcon, () => this.scene.start('OceanScene'));

    // Bait stacks (identical units - one cell, a count) and individual
    // catches (each its own cell, since two catches of the same species can
    // weigh - and be worth - different amounts, so they're never merged
    // into one count) all only show up once the player actually has one.
    // Each item carries a `value` too - a catch's own sale value, or a
    // bait's per-pack cost as the closest equivalent - purely so the sort
    // toggle below has something uniform to sort every item by.
    this.allItems = [];
    BAIT.forEach((bait) => {
      if (GameState.ownedCount(bait.id) > 0) {
        this.allItems.push({
          itemId: bait.id,
          name: bait.name,
          sub: `Owned: ${GameState.ownedCount(bait.id)}`,
          draw: BAIT_ICON_DRAWERS[bait.id],
          value: bait.cost
        });
      }
    });
    GameState.data.catches.forEach((c) => {
      const info = getCatchable(c.itemId);
      const drawer = CATCH_DRAWERS[c.itemId];
      this.allItems.push({
        itemId: c.itemId,
        uid: c.uid,
        name: info.name,
        sub: `${c.weightKg}kg`,
        draw: drawer ? (g, x, y) => drawer(g, x, y, c.weightKg) : null,
        value: c.value
      });
    });

    this.viewportBottom = height - VIEWPORT_BOTTOM_MARGIN;

    if (this.allItems.length === 0) {
      this.add
        .text(width / 2, VIEWPORT_TOP + (this.viewportBottom - VIEWPORT_TOP) / 2, "Nothing in your bag yet.\nBuy bait or catch something first!", {
          ...subheading('17px'),
          align: 'center'
        })
        .setOrigin(0.5);
      return;
    }

    this.searchBox = createSearchBox(this, width / 2 - 90, 120, 320, {
      placeholder: 'Search your bag...',
      onChange: () => this.refreshGrid()
    });

    this.sortBtn = createBubbleButton(this, width / 2 + 165, 120, 190, 40, 'Sort: Default', () => {
      this.sortByValue = !this.sortByValue;
      this.sortBtn.setLabel(this.sortByValue ? 'Value: High → Low' : 'Sort: Default');
      this.refreshGrid();
    });

    // Registered once here (not inside refreshGrid, which reruns on every
    // search keystroke and sort toggle) so scrolling never stacks up
    // duplicate listeners - it reads this.gridContainer/this.maxScroll
    // fresh each time, so it stays correct across every rebuild.
    this.input.on('wheel', (pointer, over, dx, dy) => {
      if (this.maxScroll <= 0 || !this.gridContainer) return;
      this.gridContainer.y = Phaser.Math.Clamp(this.gridContainer.y - dy * SCROLL_SPEED, -this.maxScroll, 0);
      this.redrawScrollbar(this.viewportBottom - VIEWPORT_TOP);
    });

    this.refreshGrid();
  }

  // Rebuilds just the grid (cells, scroll state, scrollbar) in place -
  // called on every search keystroke and every sort-toggle click, so it
  // deliberately never touches the search box or restarts the scene.
  refreshGrid() {
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    const viewportHeight = this.viewportBottom - VIEWPORT_TOP;

    if (this.gridContainer) {
      this.gridContainer.destroy();
      this.gridContainer = null;
    }
    if (this.gridMaskGraphics) {
      this.gridMaskGraphics.destroy();
      this.gridMaskGraphics = null;
    }
    if (this.scrollG) {
      this.scrollG.destroy();
      this.scrollG = null;
    }
    if (this.scrollHintText) {
      this.scrollHintText.destroy();
      this.scrollHintText = null;
    }
    if (this.emptyResultsText) {
      this.emptyResultsText.destroy();
      this.emptyResultsText = null;
    }
    this.cells = [];

    const query = this.searchBox.getValue().trim().toLowerCase();
    let items = query ? this.allItems.filter((item) => item.name.toLowerCase().includes(query)) : this.allItems.slice();
    if (this.sortByValue) items = items.slice().sort((a, b) => (b.value || 0) - (a.value || 0));

    if (items.length === 0) {
      this.maxScroll = 0;
      this.emptyResultsText = this.add
        .text(width / 2, VIEWPORT_TOP + viewportHeight / 2, `No item matches "${this.searchBox.getValue()}"`, {
          ...subheading('16px', { color: '#bfe9ff' }),
          align: 'center'
        })
        .setOrigin(0.5);
      return;
    }

    // Everything below is built into a single scrollable container so a bag
    // full of individually-weighed catches (which never stack) can still
    // all be reached with the mouse wheel instead of overflowing off the
    // bottom of the screen - clipped to the viewport band via a mask so
    // rows scrolled out of view don't show through the header or status bar.
    this.gridContainer = this.add.container(0, 0);
    const gridWidth = COLS * CELL_W;
    const startX = (width - gridWidth) / 2 + CELL_W / 2;
    items.forEach((item, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * CELL_W;
      const y = VIEWPORT_TOP + CELL_H / 2 + 8 + row * CELL_H;
      this.buildCell(item, x, y);
    });

    const rows = Math.ceil(items.length / COLS);
    const contentHeight = rows * CELL_H + 16;
    this.maxScroll = Math.max(0, contentHeight - viewportHeight);

    this.gridMaskGraphics = this.make.graphics();
    this.gridMaskGraphics.fillStyle(0xffffff);
    this.gridMaskGraphics.fillRect(0, VIEWPORT_TOP, width, viewportHeight);
    this.gridContainer.setMask(this.gridMaskGraphics.createGeometryMask());

    if (this.maxScroll > 0) {
      this.scrollTrackX = width - 12;
      this.scrollG = this.add.graphics();
      this.redrawScrollbar(viewportHeight);
      if (!this.scrollHintText) {
        this.scrollHintText = this.add
          .text(width / 2, height - 8, 'Scroll for more', label('12px', { color: '#7fa8bd' }))
          .setOrigin(0.5, 1);
      }
    }
  }

  redrawScrollbar(viewportHeight) {
    this.scrollG.clear();
    this.scrollG.fillStyle(0x0c2430, 0.4);
    this.scrollG.fillRoundedRect(this.scrollTrackX, VIEWPORT_TOP, 6, viewportHeight, 3);
    const ratio = Phaser.Math.Clamp(viewportHeight / (viewportHeight + this.maxScroll), 0.08, 1);
    const thumbH = viewportHeight * ratio;
    const scrollFrac = this.maxScroll > 0 ? -this.gridContainer.y / this.maxScroll : 0;
    const thumbY = VIEWPORT_TOP + scrollFrac * (viewportHeight - thumbH);
    this.scrollG.fillStyle(0x4ad991, 0.85);
    this.scrollG.fillRoundedRect(this.scrollTrackX, thumbY, 6, thumbH, 3);
  }

  buildCell(item, x, y) {
    const color = rarityColorFor(item.itemId);
    const panel = this.add.rectangle(x, y, CELL_W - 16, CELL_H - 16, color.fill).setStrokeStyle(2, color.stroke);
    this.gridContainer.add(panel);

    const g = this.add.graphics();
    if (item.draw) item.draw(g, x, y - CELL_H / 2 + 46);
    this.gridContainer.add(g);

    // Added after the icon above so it always renders on top of it (a
    // tall silhouette can otherwise paint over it).
    const tierText = this.add
      .text(x, y - (CELL_H - 16) / 2 + 8, rarityLabelFor(item.itemId), label('11px', { color: color.tag }))
      .setOrigin(0.5, 0);
    this.gridContainer.add(tierText);

    const nameText = this.add.text(x, y - 16, item.name, label('15px')).setOrigin(0.5);
    this.gridContainer.add(nameText);
    const subText = this.add.text(x, y + 3, item.sub, label('11px', { color: '#bfe9ff' })).setOrigin(0.5);
    this.gridContainer.add(subText);

    const equipBtn = createBubbleButton(this, x, y + 34, 116, 32, '', () => this.equip(item.itemId, item.uid), {
      fontSize: '12px',
      container: this.gridContainer
    });

    // A stackable item (Prawns, no uid) is "equipped" at the species level.
    // An individual catch is equipped by its own uid - so with three
    // Flatheads in the bag, equipping one only marks that exact card as
    // Equipped, not all three (each could be a different weight/value).
    const refresh = () => {
      const equipped =
        item.uid != null ? GameState.equippedCatchUid === item.uid : GameState.equippedBait === item.itemId && GameState.equippedCatchUid == null;
      equipBtn.setLabel(equipped ? 'Equipped' : 'Equip');
      equipBtn.setEnabled(!equipped);
    };
    refresh();

    this.cells.push({ refresh });
  }

  equip(itemId, uid) {
    if (!GameState.equipBait(itemId, uid)) return;
    this.cells.forEach((cell) => cell.refresh());
  }
}
