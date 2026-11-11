/**
 * Project facts and copy. Everything marked `live` is quoted or condensed from 18thavenue.com.bn (Home, About,
 * Facilities, Landmarks, Contact) as of 2026-11-10. Headlines marked `ours` are new pitch wording, not yet confirmed
 * by the client (also listed in the README).
 */
export const project = {
  name: '18th Avenue',
  url: 'https://18thavenue.com.bn',
  // live
  tagline: 'Your Sky-High Sanctuary',
  aboutTagline: 'Your Detached Home in the Sky',
  city: 'Bandar Seri Begawan',
  country: 'Negara Brunei Darussalam',
  lot: 'Lot 32170, Kg. Pusar Ulak, Mukim Kianggeh, Bandar Seri Begawan',
  description:
    'Five towers, 159 private residences and 17 retail units on 2.5 acres in the heart of Bandar Seri Begawan, master-planned by Surbana Jurong. Bungalows in the air: one lift, two homes, every floor.',
  intro:
    'In the heart of Bandar Seri Begawan, 18th Avenue stands as an epitome of modern lifestyle homes where tenants can enjoy a private and tranquil yet resort like lifestyle, while staying well-connected to the city.',
  development:
    'The development iconically sits on a 2.5 acre of land in the very heart of the city. Consisting of 5 towers, 18 levels of 159 private, exclusive, luxury apartments and 17 retail units, the project offers a wide range of choices at affordable prices.',
  developer: 'Unity Land Sdn Bhd',
  landowner: 'Brunei Hotel',
  architect: 'Surbana Jurong',
  architectNote: 'Renowned Singapore based (Temasek owned) Concept Architect and Master Planner',
  copyright: 'Copyright © 2026 Unityland',
  construction: { period: '3 years', commencement: 'July 2024', commencementISO: '2024-07' },
  disclaimer:
    'All illustrations and pictures are artist’s impressions only. The items are subject to variations, modifications and substitutions as may be recommended by the Company’s appointed architect and/or relevant Approving Authorities.',
} as const;

// live (home page "It consist of 5 towers, 18 levels of 159 private, exclusive, luxury apartments and 17 retail units")
export const facts = [
  { value: 2.5, decimals: 1, unit: 'acres', label: 'in the very heart of the city' },
  { value: 5, unit: 'towers', label: 'master-planned by Surbana Jurong' },
  { value: 18, unit: 'levels', label: 'of private, exclusive residences' },
  { value: 159, unit: 'residences', label: 'luxury apartments' },
  { value: 17, unit: 'retail units', label: 'integrated shops and eateries' },
  { value: 99, unit: 'year title', label: 'single strata title' },
] as const;

// live: "Features of Development"
export const features = [
  {
    id: 'lift',
    title: 'Bungalows in the air',
    body: 'Private exclusive and low density per floor with one passenger lift serving only 2 units at each floor.',
  },
  {
    id: 'basement',
    title: 'Drive home to your lift',
    body: 'Full basement carpark, allowing residents to drive directly to their designated carpark leading to their private lift lobby. 2 carparks allocated for 3 BR units.',
  },
  {
    id: 'structure',
    title: 'Higher, larger, finer',
    body: 'Shear wall design, with flat slabs, allowing quality wall finishes, higher ceiling height and bigger nett floor area.',
  },
] as const;

// live: "Our Attractions"
export const attractions = [
  { title: 'We Offer Lifestyle Home', body: 'Provides a Modern/Upscale Living Comfort.' },
  { title: 'Designed for High Efficiency Layout', body: 'Includes more livable space, higher ceiling and quality wall finishes.' },
  { title: 'We sell at Affordable Prices', body: 'Provides value for money for a niche product.' },
  {
    title: 'International Concept Designer & Master Planner',
    body: 'Design concept provides for ample natural lighting, ventilation and all round views.',
  },
  { title: 'Integrated Shop Units', body: 'Provide integrated row of adjacent shops for retail and eateries for occupants convenience.' },
  { title: 'Full Basement Parking', body: 'Enable fully covered carparks with direct elevator access to respective units.' },
  {
    title: 'Prime Location',
    body: 'Situated in heart of city, proximity to Prestigious Schools, Hospital, Banks, Airport, Gov’t Complexes and Recreational Parks.',
  },
  {
    title: 'Fully equipped “Resort Like” facilities',
    body: 'Includes Clubhouse, Swimming Pool, Tennis Court, Gym, Sauna, Poolside Gourmet, Reading and Entertainment rooms, outdoor Fitness Station, Children’s Playground, Putting Green, Gardenvillion, BBQ pit.',
  },
  {
    title: 'Ready to “Move-in” Condo Condition',
    body: 'Includes Air-Conditioning and Lighting to all rooms, Built-in Kitchen Cabinets, “Apartment fit” space and power outlets for fridge, oven and washing machines.',
  },
  {
    title: 'High Security',
    body: 'Includes Gated & Security guarded premises, CCTV monitoring, Security intercom & Access for safety and convenience.',
  },
  { title: '99 years single Strata Title', body: 'Provides Maximum allowable Strata-hold Title.' },
] as const;

// live: About page
export const about = {
  welcome:
    'Here at 18th Avenue, we provide modern homes catered to diverse demographics and lifestyles. Whether you are a go-getter looking for an efficient location to the city, or a family looking for a tranquil lifestyle, our residence gives you a versatile space for you to come home to.',
  castle:
    'We believe a person’s home is their castle, close to wherever he needs to be - whether to work in the city or to unwind with their loved ones, 18th Avenue is strategically located at the heart of the capital, Bandar Seri Begawan.',
  jv: 'Prime land located at Lot 32170 at Kg. Pusar Ulak, Mukim Kianggeh, Bandar Seri Begawan, 18th Avenue is a joint development between the landowner, Brunei Hotel and the developer, Unity Land Sdn. Bhd.',
  design:
    'Designed by International and Award-winning architectural firm, Surbana Jurong, this Singapore-based architect simulates exclusive spacious living of “bungalows in the air” with only 2 detached units per every floor.',
  scale:
    'Consisting of 5 high-rise towers with a total of 159 units of luxurious modern condominiums and 17 units of commercial shop lots, 18th Avenue offers diverse layout choices and full condo facilities for its tenants.',
  value: 'We Build Value.',
  valueBody: 'We cultivate value from vision, laying the foundation for success with every strategic brick we place.',
} as const;

// live: footer / contact page. No WhatsApp or social profiles are published, so none are shown.
export const contact = {
  company: 'Unity Land Sdn Bhd',
  address: ['Unit 3, First Floor,', 'Block A, Lot 28940,', 'Simpang 188, Jalan Babu Raja,', 'Kampong Kiarong, BE1318,', 'Bandar Seri Begawan', 'Negara Brunei Darussalam'],
  phone: '+673 243 1818',
  phoneHref: 'tel:+6732431818',
  email: 'contact@unityland.co',
} as const;

// live: home page "Consultants" logos (roles only where the logo itself states one)
export const consultants = [
  { id: 'surbana-jurong', name: 'Surbana Jurong', role: 'Concept Architect & Master Planner' },
  { id: 'arkitek-urusreka', name: 'Arkitek Urusreka', role: 'Architecture & Interior Design' },
  { id: 'lah-consultants', name: 'LAH Consultants', role: null },
  { id: 'alamsejagat', name: 'Alamsejagat Consulting Engineers', role: null },
  { id: 'jurutera-perunding-lce', name: 'Jurutera Perunding LCE', role: 'Electrical & Mechanical Engineering' },
  { id: 'perunding-primareka', name: 'Perunding Primareka', role: 'Civil & Structural Engineering' },
] as const;

export const nav = [
  { label: 'Home', href: '/' },
  { label: '3D Experience', href: '/experience' },
  { label: 'Residences', href: '/residences' },
  { label: 'Location', href: '/#location' },
  { label: 'Amenities', href: '/#amenities' },
  { label: 'Shops & Dining', href: '/#retail' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '#contact' },
] as const;
