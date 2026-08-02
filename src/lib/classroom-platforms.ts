export type PlatformKind = 'iframe' | 'external' | 'app'

export interface ClassroomPlatform {
  id: string
  name: string
  nameAr: string
  icon: string
  color: string
  desc: string
  kind: PlatformKind
  embedUrl: string
  url: string
  ageGroup: string
}

export const CLASSROOM_PLATFORMS: ClassroomPlatform[] = [
  {
    id: 'scratch',
    name: 'Scratch',
    nameAr: 'سكراتش',
    icon: '🐱',
    color: 'from-orange-500 to-amber-500',
    desc: 'بيئة البرمجة القائمة على الكتل الأشهر عالمياً',
    kind: 'iframe',
    embedUrl: 'https://scratch.mit.edu/projects/editor/?tip_bar=0',
    url: 'https://scratch.mit.edu',
    ageGroup: '8+',
  },
  {
    id: 'scratchjr',
    name: 'ScratchJr',
    nameAr: 'سكراتش جونيور',
    icon: '🚂',
    color: 'from-rose-400 to-red-500',
    desc: 'نسخة سكراتش للصغار (٥-٧ سنوات) — تطبيق للتابلت',
    kind: 'app',
    embedUrl: '',
    url: 'https://www.scratchjr.org',
    ageGroup: '5-7',
  },
  {
    id: 'pictoblox',
    name: 'PictoBlox',
    nameAr: 'بيكتوبلوكس',
    icon: '🤖',
    color: 'from-emerald-500 to-teal-500',
    desc: 'برمجة بالكتل مع ذكاء اصطناعي وتحكم بالروبوتات',
    kind: 'external',
    embedUrl: '',
    url: 'https://pictoblox.ai',
    ageGroup: '8+',
  },
  {
    id: 'pictoblox-jr',
    name: 'PictoBlox Junior',
    nameAr: 'بيكتوبلوكس جونيور',
    icon: '🦾',
    color: 'from-cyan-500 to-sky-500',
    desc: 'نسخة الصغار من بيكتوبلوكس — تطبيق للتابلت',
    kind: 'app',
    embedUrl: '',
    url: 'https://junior.pictoblox.ai',
    ageGroup: '6+',
  },
  {
    id: 'blockly',
    name: 'Blockly Games',
    nameAr: 'ألعاب بلوكلي',
    icon: '🧩',
    color: 'from-violet-500 to-purple-500',
    desc: 'ألعاب ممتعة لتعلم أساسيات البرمجة بالكتل',
    kind: 'iframe',
    embedUrl: 'https://blockly.games/?lang=ar',
    url: 'https://blockly.games',
    ageGroup: '7+',
  },
  {
    id: 'makecode',
    name: 'MakeCode (micro:bit)',
    nameAr: 'مايك كود',
    icon: '🎛️',
    color: 'from-blue-500 to-indigo-500',
    desc: 'برمجة المايكروبت والأجهزة التفاعلية بالكتل',
    kind: 'iframe',
    embedUrl: 'https://makecode.microbit.org/',
    url: 'https://makecode.microbit.org',
    ageGroup: '9+',
  },
  {
    id: 'pythontutor',
    name: 'Python Tutor',
    nameAr: 'مفسّر بايثون',
    icon: '🐍',
    color: 'from-yellow-500 to-amber-600',
    desc: 'تصوّر تنفيذ كود بايثون خطوة بخطوة لشرحه',
    kind: 'iframe',
    embedUrl: 'https://pythontutor.com/visualize.html#mode=edit',
    url: 'https://pythontutor.com',
    ageGroup: '10+',
  },
  {
    id: 'w3schools',
    name: 'W3Schools TryIt',
    nameAr: 'محرر دبليو 3',
    icon: '🧪',
    color: 'from-green-500 to-emerald-600',
    desc: 'تجربة HTML وCSS وJavaScript مباشرة في المتصفح',
    kind: 'external',
    embedUrl: '',
    url: 'https://www.w3schools.com/tryit/',
    ageGroup: '10+',
  },
  {
    id: 'codeorg',
    name: 'Code.org',
    nameAr: 'كود دوت أورج',
    icon: '🌐',
    color: 'from-red-500 to-rose-600',
    desc: 'دروس تفاعلية لتعلم البرمجة من الصفر',
    kind: 'external',
    embedUrl: '',
    url: 'https://studio.code.org',
    ageGroup: '6+',
  },
  {
    id: 'tinkercad',
    name: 'Tinkercad',
    nameAr: 'تينكركاد',
    icon: '🔧',
    color: 'from-orange-400 to-red-500',
    desc: 'تصميم ثلاثي الأبعاد ومحاكاة دوائر إلكترونية',
    kind: 'external',
    embedUrl: '',
    url: 'https://www.tinkercad.com/circuits',
    ageGroup: '9+',
  },
  {
    id: 'mblock',
    name: 'mBlock',
    nameAr: 'إم بلوك',
    icon: '🤖',
    color: 'from-teal-500 to-cyan-600',
    desc: 'برمجة روبوتات mBot والذكاء الاصطناعي',
    kind: 'external',
    embedUrl: '',
    url: 'https://ide.mblock.cc',
    ageGroup: '8+',
  },
  {
    id: 'appinventor',
    name: 'App Inventor',
    nameAr: 'منشئ التطبيقات',
    icon: '📱',
    color: 'from-purple-500 to-fuchsia-600',
    desc: 'بناء تطبيقات أندرويد بالكتل والسحب والإفلات',
    kind: 'external',
    embedUrl: '',
    url: 'https://ai2.appinventor.mit.edu',
    ageGroup: '12+',
  },
]

export function getClassroomPlatform(id: string): ClassroomPlatform | undefined {
  return CLASSROOM_PLATFORMS.find((p) => p.id === id)
}
