# Sheep.land Product Catalog Analysis

## Overview
This document contains a comprehensive analysis of all products in the sheep.land website, including exact names, categories, breeds, cuts, and variants to help download the most accurate and specific images for each product.

## Product Categories

### 1. UDHEYA (الأضحية)
Premium sheep for religious sacrifice during Eid al-Adha.

#### Baladi Sheep (خروف بلدي)
- **Description**: Egyptian Baladi sheep, traditional Egyptian breed
- **Origin**: Fayoum Farms
- **Variants**:
  - Small (35-45kg) - `baladi_udheya_40kg`
  - Medium (45-55kg) - `baladi_udheya_50kg`
  - Large (55-70kg) - `baladi_udheya_62kg`
- **Image**: sheep-baladi.jpg

#### Barki Sheep (خروف برقي)
- **Description**: Desert-adapted Bedouin breed with lean meat
- **Origin**: Marsa Matrouh Desert Farms
- **Premium**: Yes
- **Variants**:
  - Small (35-40kg) - `barki_udheya_37kg`
  - Medium (40-45kg) - `barki_udheya_42kg`
  - Large (45-50kg) - `barki_udheya_47kg`
- **Image**: sheep-barki.jpg

### 2. LIVE SHEEP (الأغنام الحية)
Live animals for breeding, farms, or personal raising.

#### Breeding Rams (كباش)
- **Type**: `breeding_rams`
- **Variant**: Baladi Ram (80-100kg) - `live_ram_baladi_breeding`
- **Origin**: Selection Breeding Center

#### Breeding Ewes (نعاج)
- **Type**: `breeding_ewes`
- **Variant**: Saidi Ewe (55-70kg) - `live_ewe_saidi_breeding`
- **Origin**: Elite Breeding Center
- **Premium**: Yes

#### Weaned Lambs (حملان مفطومة)
- **Type**: `young_lambs`
- **Variant**: Weaned Lamb (15-25kg) - `live_lambs_weaned`
- **Age**: 3-6 months old
- **Origin**: Young Stock Farms

### 3. MEAT CUTS (قطعيات لحم)
Fresh meat cuts from premium sheep.

#### Premium Lamb Cuts (قطعيات ضأن فاخرة)
- **Type**: `lamb_premium_cuts`
- **Cuts**:
  - Lamb Chops (per kg) - `lamb_chops_premium` - Image: lamb-ribs.jpg
  - Lamb Leg (2.5-4kg) - `lamb_leg_whole` - Image: lamb-leg.jpg

#### Standard Lamb Cuts (قطعيات ضأن عادية)
- **Type**: `lamb_standard_cuts`
- **Cuts**:
  - Lamb Shoulder (per kg) - `lamb_shoulder_boneless` - Image: lamb-shoulder.jpg
  - Lamb Mince (per kg) - `lamb_mince_fresh` - Image: lamb-minced.jpg

#### Mutton Cuts (قطعيات لحم الغنم)
- **Type**: `mutton_cuts`
- **Cut**: Mutton Stew Cuts (per kg) - `mutton_stew_cuts`

### 4. GATHERING PACKAGES (باقات المناسبات)
Complete catering packages for events and celebrations.

#### Family Packages (باقات عائلية)
- **Type**: `family_packages`
- **Variant**: Family Small (8-12 people) - `gathering_small_family`
- **Image**: event-small-gathering.jpg

#### Celebration Packages (باقات الاحتفالات)
- **Type**: `celebration_packages`
- **Variant**: Celebration Medium (20-30 people) - `gathering_medium_celebration`
- **Premium**: Yes
- **Image**: event-large-gathering.jpg

#### Wedding Packages (باقات أفراح)
- **Type**: `wedding_packages`
- **Variant**: Wedding Large (50-80 people) - `gathering_large_wedding`
- **Premium**: Yes
- **Image**: event-large-gathering.jpg

#### BBQ Packages (باقات الشواء)
- **Type**: `bbq_packages`
- **Variant**: BBQ (15-25 people) - `bbq_premium_mixed`
- **Premium**: Yes
- **Image**: event-catering.jpg

## Key Observations

### Breed Names
- **Baladi (بلدي)**: Traditional Egyptian breed
- **Barki (برقي)**: Desert-adapted Bedouin breed
- **Saidi (صعيدي)**: Upper Egyptian breed (for ewes)

### Existing Images
Current product images in the directory:
- Sheep breeds: baladi, barki, black, white, imported, field, flock
- Meat cuts: shoulder, leg, ribs, minced, steak, cuts (general)
- Events: small gathering, large gathering, catering
- Udheya: standard

### Missing Images That Could Be Added
Based on the product catalog, these specific images could enhance the product presentation:
1. Specific ram/breeding male sheep images
2. Ewe/breeding female sheep images
3. Young lamb/weaned lamb images
4. Mutton stew cuts
5. Specific BBQ/mixed grill images
6. Wedding-specific event images

### Image Mapping Logic in Code
The `getProductImage()` function in app.js maps products to images based on:
1. Product category (udheya, livesheep, meat, gatherings)
2. Item key contains specific keywords (barki, baladi, shoulder, leg, etc.)
3. Name fields as fallback
4. Premium status for some categories

### Recommendations for Image Downloads
When downloading images for missing products:
1. **Breeding Rams**: Look for mature male sheep, muscular build
2. **Breeding Ewes**: Female sheep with visible udders
3. **Weaned Lambs**: Young sheep, 3-6 months appearance
4. **Mutton Stew Cuts**: Cubed meat pieces for stewing
5. **Wedding Packages**: Large scale catering setup
6. **BBQ Packages**: Mixed grilled meats display

## Product Naming Conventions
- Item keys use lowercase with underscores: `baladi_udheya_40kg`
- Type keys group similar products: `baladi_sheep`, `barki_sheep`
- Weight ranges are clearly specified in both English and Arabic
- Premium products are marked with `is_premium: true`