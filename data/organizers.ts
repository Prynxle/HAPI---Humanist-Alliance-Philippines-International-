import jaztineImage from "../facilitators/Jaztine Santos.jpg";
import shaneImage from "../facilitators/Shane Haro.png";
import kellyImage from "../facilitators/Kelly Kim Sepida.png";
import annikaImage from "../facilitators/Annika Palaganas - preferred photo.jpg";

import marissaImage from "../facilitators/Marissa Torres Langseth.jpg";
import michaelImage from "../facilitators/Michael Sherman.jpg";

import mariaImage from "../facilitators/Maria Rosa.jpg";
import shawnImage from "../facilitators/Shawn Quiming.jpg";

import christianImage from "../facilitators/Christian Fajutagana.jpg";
import diosaImage from "../facilitators/Diosa Marie  Aguirre.jpg";
import alvinImage from "../facilitators/AJ Ballares.png";

import mheerImage from "../facilitators/MHER Arts & Crafts.jpg";
import ministryImage from "../facilitators/The Ministry.jpg";
import zedrickImage from "../facilitators/Zedrick Espiritu.png";
import walterImage from "../facilitators/Walter Fortes.jpg";

export interface FeaturedPersonality {
  name: string;
  title: string;
  bio: string;
  image: string;
  orientation: "landscape" | "portrait" | "square";
}

export interface InstitutionalRepresentative {
  name: string;
  title: string;
  image: string;
}

export const featuredPersonalities: FeaturedPersonality[] = [
  {
    name: "JAZTINE SANTOS",
    title: "MASTER OF CEREMONIES, PROJECT HEAD CHIEF OF ACADEMIC AFFAIRS",
    bio: "Jaztine Santos is the project head and the master of ceremonies of the 1st Secular Philosophical Paper Conference sponsored by Humanists International through the Young Humanist Grant. He took his undergraduate degree in Philosophy at the Polytechnic University of the Philippines and graduated with a grade of 1.16. He is currently taking his Master's degree in Philosophy at Ateneo de Manila University. His research interests and intended areas of specialization are philosophy of religion and the occult, academic theology, phenomenology and existentialism, time travel, and metaethics. Outside the academia, he loves making espresso as a barista and making covers with his piano, vocals, and violin. He is also obsessed with music that evokes nostalgia with heavy synths, pads, and reverbed beats which made him a fan of Nightly, Fly By Midnight, LANY, WOAH, Hazlett, and Chezile. As a secular humanist, he is currently serving as the Chief of Academic Affairs of HAPI's Philosophy Department - Secular & Existential Philosophies and a regular web writer as a HAPI Scholar.",
    image: jaztineImage.src,
    orientation: "landscape",
  },
  {
    name: "SHANE HARO",
    title: "CHIEF EXECUTIVE OFFICER, HAPI",
    bio: "Shane Haro is Chief Executive Officer of Humanist Alliance Philippines, International. After earning his AB in Communication Arts from the University of Santo Tomas, he pursued a Master's in Bilingual and Multicultural Education at the Instituto Franklin–Universidad de Alcalá in Madrid. He most recently represented the organization at the World Humanist Congress 2026. Last year, he addressed the United Nations on Freedom of Expression in the Philippines. Across his seven years of humanist advocacy, he has overseen the publication of hundreds of Filipino humanist stories and thinkpieces on the HAPI website. As Chief of the HAPI Scholars, he oversees the training of young humanist writers and artists from across the Philippines, drawing on their creativity to help promote humanism among Filipino youth. Through their help, he produced the Philippines' first-ever humanist animation series. He has an unusual obsession with pop culture, and could probably slay pop culture trivia night with you.",
    image: shaneImage.src,
    orientation: "square",
  },
  {
    name: "KELLY KIM SEPIDA",
    title: "ART DIRECTOR, HAPI",
    bio: "Kelly Kim F. Sepida is HAPI's Art Director and the official graphic artist of the 1st Secular Philosophical Paper Conference. He is responsible for the aesthetic visuals of HAPI, of the publication materials of the event posted in our social media platforms, and of the merchandise - particularly, the conference booklet. He graduated summa cum laude with a degree on Architectural Drafting at Carlos Hilado Memorial State University - Talisay (Main) Campus. Beyond his design work, he enjoys binge-watching animated and horror films.",
    image: kellyImage.src,
    orientation: "portrait",
  },
  {
    name: "ANNIKA PALAGANAS",
    title: "SOCIAL MEDIA DIRECTOR",
    bio: "Annika Palaganas is the Social Media Director of HAPI. She is the brains behind HAPI's social media strategy in general and for promoting and disseminating information on the 1st Secular Philosophical Paper Conference to ensure that it gains maximum visibility. She graduated cum laude with a Bachelor's degree on Organizational Communication at the University of the Philippines - Manila. In her free time she enjoys going to the gym, reading and writing.",
    image: annikaImage.src,
    orientation: "square",
  },
];

export const keyOfficials: InstitutionalRepresentative[] = [
  { name: "MARISSA TORRES LANGSETH", title: "FOUNDER", image: marissaImage.src },
  { name: "MICHAEL SHERMAN", title: "CHAIRMAN, HAPI", image: michaelImage.src },
];

export const keyPersonnel: InstitutionalRepresentative[] = [
  { name: "MARIA ROSA CONSTANTE", title: "COMMUNICATIONS DIRECTOR", image: mariaImage.src },
  { name: "SHAWN EVANS QUIMING", title: "CAPTION WRITING ASSISTANCE & INVITATION", image: shawnImage.src },
];

export const boardOfTrustees: InstitutionalRepresentative[] = [
  { name: "CHRISTIAN FAJUTAGANA", title: "WEB CONSULTANT", image: christianImage.src },
  { name: "DIOSA MARIE AGUIRRE", title: "CHIEF FINANCIAL OFFICER", image: diosaImage.src },
  { name: "ALVIN JOHN BALLARES", title: "PROJECT CONSULTATION / NETWORKING CHIEF", image: alvinImage.src },
];

export const externalPartners: InstitutionalRepresentative[] = [
  { name: "MHEER ARTS & CRAFTS", title: "MERCHANDISE", image: mheerImage.src },
  { name: "THE MINISTRY", title: "VENUE & CATERING", image: ministryImage.src },
  { name: "ZEDRICK ESPIRITU", title: "TECHNOLOGY ADMINISTRATOR", image: zedrickImage.src },
  { name: "JHON WALTER FORTES", title: "GUEST SERVICE ADMINISTRATOR", image: walterImage.src },
];
