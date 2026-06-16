export type ScriptPanel = {
  id: string;
  label: string;
  chars: string[];
  type?: 'chars' | 'romaji';
};

const split = (s: string) => [...s];

const HIRAGANA = split(
  'あいうえおかきくけこがぎぐげごさしすせそざじずぜぞたちつてとだぢづでどなにぬねのはひふへほばびぶべぼぱぴぷぺぽまみむめもやゆよらりるれろわをんゃゅょっー',
);

const KATAKANA = split(
  'アイウエオカキクケコガギグゲゴサシスセソザジズゼゾタチツテトダヂヅデドナニヌネノハヒフヘホバビブベボパピプペポマミムメモヤユヨラリルレロワヲンャュョッー',
);

const HANGUL = split(
  '가나다라마바사아자차카타파하각간갈감강개거건검게겨고공과관괴교구국군궁귀그극근글금기김나내너년노누는능니다대더덕도동되된두드든들등라래러레로리만명모무문물미박반발방배번별보부북분비빛사산상새서선설성세소수숙순시식신실아안않알암애야어언없었에연영예오온완요욕용우운원위유은음의이인일임입있자작장재전정제조주준중지직진집차참첫최추출치친타탁터토통하학한할함합항해행험현형호화확환활회후',
);

const JAMO = split('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ');

const HANZI_COMMON = split(
  '的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出而要于就下得可你年生自会那后能对着事其里所去行过家十用发天如然作方成者多日都三小军二无同么经法当起与好看学进种将还分此心前面又定见只主没重意力理因些表方拉把名提东号向走指次话常气头比便利相实回分点听更觉路接打教数民增基感四三少件住很位次第使公体做己已战向性总特改题亲东者解议者持识非感住记许设更走议元百需价花党华城石府离青准况飞马口革听装难功必该欢随演首意难议任响友号显吗越语言读谁课谢请说问答字写纸红蓝绿黑白黄',
);

const HANZI_NUMBERS = split('零一二三四五六七八九十百千万亿');

const ARABIC = split('ابتثجحخدذرزسشصضطظعغفقكلمنهويءآأؤإئئةى');

const CYRILLIC = split('абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ');

const EXTENDED = split('àáâãäåæçèéêëìíîïñòóôõöùúûüýÿœßÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸŒ¿¡«»€£¥•…–—');

const SPANISH = split('áéíóúüñ¿¡ÁÉÍÓÚÜÑ');
const FRENCH = split('àâæçéèêëîïôœùûüÿÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ');
const GERMAN = split('äöüßÄÖÜ');
const ITALIAN = split('àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ');
const PORTUGUESE = split('áâãàçéêíóôõúüÁÂÃÀÇÉÊÍÓÔÕÚÜ');

const PANELS: Record<string, ScriptPanel[]> = {
  ja: [
    { id: 'hiragana', label: 'あ', chars: HIRAGANA },
    { id: 'katakana', label: 'ア', chars: KATAKANA },
    { id: 'romaji', label: 'Romaji', chars: [], type: 'romaji' },
  ],
  zh: [
    { id: 'hanzi', label: '汉字', chars: HANZI_COMMON },
    { id: 'numbers', label: '123', chars: HANZI_NUMBERS },
  ],
  ko: [
    { id: 'hangul', label: '한글', chars: HANGUL },
    { id: 'jamo', label: '자모', chars: JAMO },
  ],
  ar: [{ id: 'arabic', label: 'عربي', chars: ARABIC }],
  ru: [{ id: 'cyrillic', label: 'Кири', chars: CYRILLIC }],
  es: [{ id: 'spanish', label: 'áé', chars: SPANISH }],
  fr: [{ id: 'french', label: 'àç', chars: FRENCH }],
  de: [{ id: 'german', label: 'äö', chars: GERMAN }],
  it: [{ id: 'italian', label: 'àè', chars: ITALIAN }],
  pt: [{ id: 'portuguese', label: 'ãõ', chars: PORTUGUESE }],
  other: [{ id: 'extended', label: 'Àá', chars: EXTENDED }],
};

export function getScriptPanels(languageCode: string): ScriptPanel[] {
  return PANELS[languageCode] ?? PANELS.other;
}
