import dumaopPortrait from "../lecturers/pictures/Dumaop, Darren.jpg";
import fungoPortrait from "../lecturers/pictures/Fungo, Joyce.png";
import piamontePortrait from "../lecturers/pictures/Piamonte, Chloe.jpg";
import ulleroPortrait from "../lecturers/pictures/Ullero, Janflor.jpg";

export interface Lecturer {
  name: string;
  role: string;
  bio: string;
  image: string;
}

export const lecturers: Lecturer[] = [
  {
    name: "Darren E. Dumaop, PhD",
    role: "Plenary Lecturer",
    bio: "Darren E. Dumaop, PhD is an Associate Professor of Psychology and Associate Dean of the College of Liberal Arts at De La Salle University, where he serves as the inaugural Director of the Conflict in Religion Psychology Research Laboratory. He holds a PhD in Psychology, major in Social Psychology and minor in Personality, from the University of the Philippines Diliman. His research examines religious pluralism, religious conflict and its relationship with identity and agency, and prejudice against and mental health among Filipinos with secular identities. He is a former Chair of the Social Psychology Division of the Psychological Association of the Philippines and former Vice President of the Pambansang Samahan sa Sikolohiyang Pilipino. He is an alumnus of the UCSIA Summer School (Antwerp, Belgium) and a fellow of the Religion and Public Life in the Philippines Program sponsored by the British Academy. His current work focuses on religious pluralism and spiritual agency, and he pioneered the undergraduate teaching of Psychology of Religion and Spirituality at De La Salle University. Despite his otherwise boring academic profile, Darren enjoys comedy, often to the point of attempting a joke and eventually becoming the joke himself. He also considers himself a bit of a Bible geek, although this expertise has yet to translate into consistent victories in social media debates with random Jesus fans.",
    image: dumaopPortrait.src,
  },
  {
    name: "Joyce Estelle S. Fungo",
    role: "Plenary Lecturer & Panelist",
    bio: "Joyce Estelle S. Fungo is an Assistant Professor of Philosophy at the University of the Philippines-Baguio and a PhD candidate at the School of Divinity, History, Philosophy, and Art History in the University of Aberdeen, supervised by Luca Moretti (University of Eastern Piedmont, Italy) and Federico Luzzi (University of Aberdeen, Scotland). Her course offerings in philosophy more recently have been in Special Questions in Ethics, Epistemology, and Metaphysics. Her academic interests rest in theories of knowledge and value and inquire into the enabling capacities of theory to better understand injustice and oppression in practice. Her hobbies shift at about the same rate as her moving from one place to another. But in various circles here and abroad, she's often found herself in board game communities, some in casual dungeons and dragons circles, and at one point in a medieval history gathering. And I guess like everyone else these days, she occasionally plays pickleball. She believes in finding ways to approach ideological differences, including religious differences, through self-reflexivity and intellectual humility — two traits she herself struggles with but continually aspires to practice.",
    image: fungoPortrait.src,
  },
  {
    name: "Chloe Nicole D. Piamonte",
    role: "Plenary Lecturer & Panelist",
    bio: "Chloe Nicole D. Piamonte teaches philosophy at the Polytechnic University of the Philippines (PUP) and the Ateneo de Manila University (ADMU). She also serves as the Chief of PUP's Center for Social Inclusivity Studies where she leads funded research on gender, diversity, and inclusivity. Her commitment to the unimaginable weight of teaching at two different institutions, and doing research, is deeply motivated by ensuring that she is too exhausted to be knocked out by existential crisis. (Also, one pays rent and the other buys maintenance meds.) Most of Chloe's days are spent either on these pretentious academic initiatives or in the classroom convincing students that existential humanism is real philosophy. She likes to believe that the latter is crucial as a personal validation that specialising in the philosophical approaches of phenomenology and existentialism is still relevant. Her days off are spent playing games to justify her impulsive purchase of a handheld computer, visiting her psychiatrist and her surgeon (the \"real\" doctor), hospital confinement, or at home staring at the shameful pile of her moldy unread books. A friend once told her that her toxic trait is loving Heidegger.",
    image: piamontePortrait.src,
  },
  {
    name: "Janflor Mc.Louie S. Ullero",
    role: "Panelist",
    bio: "Janflor Mc.Louie S. Ullero is an Associate Professor of Philosophy at the School of Arts and Sciences, NU Fairview. He earned his Bachelor of Arts and Master of Arts degrees in Philosophy from the University of Santo Tomas, where he is currently pursuing his Doctor of Philosophy degree. His doctoral research reexamines John Rawls's theory of justice in light of the ethical, political, and environmental challenges of the Anthropocene. His teaching and research interests span political philosophy, social justice, environmental ethics, human rights, peace education, humanism, and AI ethics. He is particularly interested in how philosophical inquiry can address questions of justice, human dignity, moral responsibility, and the place of human beings in a rapidly changing social and technological world. His interest in humanism extends to questions concerning secular ethics, moral life outside traditional religious frameworks, and the role of reason and critical inquiry in public life. He is also a Research Fellow at the Critical Research Association Melbourne and is affiliated with various national and international philosophical and research organizations. His scholarly work includes \"Rawls's Theory of Justice and the Social Challenges of the Pandemic in the Philippines,\" published by Brill. In February 2026, he received support from the British Academy to participate in an Early Career Researcher Workshop on Human Rights Education and Activism in Southeast Asia at Chiang Mai University, Thailand. He was also among the signatories and contributors to the 2025 Bangkok Declaration on the Social, Legal and Ethical Issues of Artificial Intelligence. Outside academia, he enjoys traveling and experiencing different cultures. For him, exploring new places is also an opportunity to encounter different ways of living, thinking, and understanding the world beyond the classroom.",
    image: ulleroPortrait.src,
  },
];