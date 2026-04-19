import homeHair from '../assets/home-hair.jpg'
import registerWarm from '../assets/register-warm.png'
import recoveryPic from '../assets/recovery-pic.png'
import registerIn from '../assets/register-in.jpg'

export const services = [
  {
    id: 'signature-haircut',
    title: 'Signature haircut',
    duration: '45 min',
    price: '$25',
    category: 'Hair',
    image: homeHair,
    description: 'Precision cut with consultation, wash, and styling finish.',
    includes: ['Consultation & style match', 'Scalp cleanse', 'Signature finishing'],
  },
  {
    id: 'color-refresh',
    title: 'Color refresh',
    duration: '90 min',
    price: '$58',
    category: 'Hair',
    image: registerWarm,
    description: 'Custom toner, gloss, and shine treatment to revive color.',
    includes: ['Color analysis', 'Toner + gloss', 'Hydrating mask'],
  },
  {
    id: 'restorative-facial',
    title: 'Restorative facial',
    duration: '60 min',
    price: '$40',
    category: 'Skin',
    image: recoveryPic,
    description: 'Deep cleanse, gentle exfoliation, and calming mask.',
    includes: ['Double cleanse', 'Exfoliation', 'Calming mask'],
  },
  {
    id: 'spa-ritual',
    title: 'Spa ritual',
    duration: '75 min',
    price: '$52',
    category: 'Wellness',
    image: registerIn,
    description: 'Steam, aromatherapy, and full-body relaxation sequence.',
    includes: ['Aromatherapy steam', 'Full-body massage', 'Warm towel finish'],
  },
]
