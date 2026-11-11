import luna2 from "@/assets/luna2.jpg";
import apollo8 from "@/assets/apollo8.jpg";
import apollo11 from "@/assets/apollo11.jpg";
import apollo17 from "@/assets/apollo17.jpg";
import change4 from "@/assets/change4.jpg";

export type LunarEvent = {
  id: string; year: string; date: string; title: string; image: string;
  summary: string; description: string; tone: number;
};

export const events: LunarEvent[] = [
  { id: "luna2", year: "1959", date: "Sep 14, 1959", title: "Luna 2 Reaches the Moon", image: luna2, tone: 110,
    summary: "The first human-made object to touch the Moon.",
    description: "The Soviet probe Luna 2 crashed into the Moon's surface near the Mare Imbrium. It carried no camera, but its instruments confirmed the Moon has no significant magnetic field. It was proof that a spacecraft could be aimed across 384,000 km of space and hit its target." },
  { id: "apollo8", year: "1968", date: "Dec 24, 1968", title: "Apollo 8 Orbits the Moon", image: apollo8, tone: 130,
    summary: "The first people to leave Earth's orbit and circle the Moon.",
    description: "Frank Borman, Jim Lovell and Bill Anders orbited the Moon ten times on Christmas Eve. Anders photographed Earth rising over the lunar horizon, an image known as \"Earthrise\" that changed how many people thought about our fragile home planet." },
  { id: "apollo11", year: "1969", date: "Jul 20, 1969", title: "Apollo 11 Lands", image: apollo11, tone: 146,
    summary: "Humans walk on the Moon for the first time.",
    description: "Neil Armstrong and Buzz Aldrin landed the lunar module Eagle in the Sea of Tranquility while Michael Collins orbited above. Watched by about 600 million people, they spent two and a half hours outside, collecting 21.5 kg of rock and soil." },
  { id: "apollo17", year: "1972", date: "Dec 11, 1972", title: "Apollo 17: The Last Visit", image: apollo17, tone: 98,
    summary: "The most recent time humans stood on the Moon.",
    description: "Gene Cernan and geologist Harrison Schmitt explored the Taurus-Littrow valley for three days, driving the Lunar Roving Vehicle more than 35 km. Schmitt was the first scientist to walk on the Moon. No one has returned since." },
  { id: "change4", year: "2019", date: "Jan 3, 2019", title: "Chang'e 4 on the Far Side", image: change4, tone: 164,
    summary: "The first soft landing on the Moon's far side.",
    description: "China's Chang'e 4 landed in Von Kármán crater, on the side of the Moon that always faces away from Earth. Because the Moon blocks radio signals, it talked to Earth through a relay satellite. Its rover, Yutu-2, became the longest-operating lunar rover ever." },
];
