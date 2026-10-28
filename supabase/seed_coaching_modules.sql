-- Seed all training modules with real video URLs
-- Run AFTER add_video_url_column.sql
-- Safe to re-run (ON CONFLICT DO NOTHING for new, UPDATE for existing)

INSERT INTO coaching_modules
  (id, title, description, category, points_value, duration_minutes, video_url, sort_order, is_active, quiz)
VALUES

-- ── Module 1: CDL Pre-Trip Inspection Overview ──────────────────────────
(
  '11111111-0001-0001-0001-000000000001',
  'CDL Pre-Trip Inspection Overview',
  'Step-by-step walkthrough of a complete CDL pre-trip inspection. Learn what to check, how to document issues, and what to tell dispatch.',
  'pre_trip', 50, 15,
  'https://www.youtube.com/embed/h6QLwlQW1rY?rel=0&modestbranding=1',
  1, true,
  '[
    {"question":"What is the primary purpose of a pre-trip inspection?","options":["To meet a company policy requirement","To identify safety defects before the trip begins","To record mileage","To warm up the engine"],"correct":1,"explanation":"Pre-trip inspections exist to catch safety defects before they cause accidents or breakdowns on the road."},
    {"question":"Which documents must a CDL driver review before starting a trip?","options":["Only the bill of lading","The previous DVIR and shipping documents","Only the route plan","Insurance card only"],"correct":1,"explanation":"Reviewing the previous DVIR ensures the driver is aware of any reported defects and their repair status."},
    {"question":"If you find a defect that makes the truck unsafe to operate, you should:","options":["Drive carefully to the first truck stop","Report it to dispatch and do not move the truck","Document it and drive anyway","Fix it yourself immediately"],"correct":1,"explanation":"An unsafe defect means the vehicle must not move until repaired and cleared by maintenance."},
    {"question":"How long should a thorough pre-trip inspection take?","options":["5 minutes","30 to 45 minutes","2 hours","Only as long as needed to check fluids"],"correct":1,"explanation":"A proper CDL pre-trip inspection takes 30 to 45 minutes to complete all required checks."},
    {"question":"Which area of the truck is checked as part of the under-vehicle inspection?","options":["CB radio only","Driveshaft, fuel tank, and brake components","Only the tires","Only the exhaust"],"correct":1,"explanation":"The under-vehicle inspection includes checking the driveshaft, fuel lines, brake components, and suspension."}
  ]'::jsonb
),

-- ── Module 2: HOS Rules and Violations ──────────────────────────────────
(
  '11111111-0002-0001-0001-000000000002',
  'HOS Rules and Violations',
  'Understanding Hours of Service regulations, what constitutes a violation, and how to stay compliant every shift.',
  'hos_eld', 50, 15,
  'https://player.vimeo.com/video/1202588866',
  2, true,
  '[
    {"question":"Under property-carrying HOS rules, how many hours can a driver drive before needing a 30-minute break?","options":["6 hours","8 hours","10 hours","11 hours"],"correct":1,"explanation":"Drivers must take a 30-minute break after 8 consecutive hours of driving."},
    {"question":"The 11-hour driving limit resets after:","options":["8 consecutive hours off duty","10 consecutive hours off duty","A 30-minute break","8 hours in sleeper berth"],"correct":1,"explanation":"The 11-hour driving limit and 14-hour on-duty window both reset after 10 consecutive hours off duty."},
    {"question":"What is the 14-hour rule?","options":["You must stop driving 14 hours after you start your shift","You can drive 14 hours per day","You must take a break every 14 hours","You can be on duty for 14 hours on weekends"],"correct":0,"explanation":"The 14-hour rule means your driving window closes 14 hours after coming on duty, regardless of breaks taken."},
    {"question":"The 60/70-hour rule applies to:","options":["Hours per day","Total driving hours per year","Total on-duty hours in 7 or 8 consecutive days","Hours spent loading and unloading"],"correct":2,"explanation":"The 60/70-hour rule limits total on-duty time to 60 hours in 7 days or 70 hours in 8 days."},
    {"question":"Which of the following is a personal conveyance (PC) use allowed by FMCSA?","options":["Driving an empty truck to a customer","Driving to a truck stop for rest after going off duty","Repositioning the truck for the next load","All driving when no cargo is on board"],"correct":1,"explanation":"Personal conveyance is allowed for driving to a rest location after going off duty -- not for business purposes."}
  ]'::jsonb
),

-- ── Module 3: Safe Following Distance ───────────────────────────────────
(
  '11111111-0003-0001-0001-000000000003',
  'Safe Following Distance',
  'Why following distance is critical for large trucks, how to calculate it, and how to adjust for speed and weather conditions.',
  'safe_driving', 40, 10,
  'https://www.youtube.com/embed/gEL3GYFAnx4?rel=0&modestbranding=1',
  3, true,
  '[
    {"question":"What is the minimum following distance recommended for a fully loaded truck at highway speed?","options":["1 second per 10 feet of vehicle length","4 seconds","7 to 8 seconds","2 car lengths"],"correct":2,"explanation":"At highway speeds, 7 to 8 seconds of following distance is the safe minimum for large trucks."},
    {"question":"When roads are wet or slippery, you should:","options":["Maintain the same following distance","Double your normal following distance","Slow down by 5 mph only","Use a lower gear only"],"correct":1,"explanation":"Wet or slippery roads double stopping distance, so your following distance must also double."},
    {"question":"A fully loaded 80,000 lb truck traveling at 65 mph needs approximately how much distance to stop?","options":["100 feet","200 feet","300 feet","The length of a football field or more"],"correct":3,"explanation":"A loaded truck at 65 mph can require over 400 feet to stop -- much more than most drivers expect."},
    {"question":"Tailgating another vehicle is dangerous for a truck driver because:","options":["It wastes fuel","The truck has a large blind spot directly behind","Trucks cannot stop quickly enough to avoid a collision if the vehicle ahead brakes","Both B and C"],"correct":3,"explanation":"Trucks have rear blind spots AND long stopping distances, making tailgating extremely dangerous."}
  ]'::jsonb
),

-- ── Module 4: Safe Backing and Maneuvering ──────────────────────────────
(
  '11111111-0004-0001-0001-000000000004',
  'Safe Backing and Tight Maneuvering',
  'Best practices for backing a tractor-trailer safely, avoiding dock accidents, and navigating tight spaces with confidence.',
  'safe_driving', 40, 12,
  NULL,
  4, true,
  '[
    {"question":"The safest backing technique for a tractor-trailer is known as:","options":["Straight-line backing only","GOAL (Get Out And Look)","Relying only on mirrors","Backing as fast as possible to finish quickly"],"correct":1,"explanation":"GOAL (Get Out And Look) means physically walking behind the truck before and during backing to check for obstacles."},
    {"question":"How many times should you GOAL during a difficult backing maneuver?","options":["Once, at the start","As many times as needed to stay safe","Only if someone is watching","Twice maximum"],"correct":1,"explanation":"There is no limit -- GOAL as often as needed. It is always better to check again than to hit something."},
    {"question":"When backing, your trailer will move in which direction relative to your steering?","options":["Same direction as the wheel turn","Opposite direction from the wheel turn","Straight regardless of steering","Only left, never right"],"correct":1,"explanation":"The trailer moves opposite to the direction you steer the tractor -- steering left moves the trailer right."},
    {"question":"Before beginning any backing maneuver, you should:","options":["Back up immediately to claim the spot","Check mirrors only","Walk the area to check for obstacles, people, and clearance","Wait for a spotter to appear"],"correct":2,"explanation":"Always walk the area first -- mirrors have blind spots and conditions may have changed since you last checked."}
  ]'::jsonb
),

-- ── Module 5: Brakes and Tire Safety ────────────────────────────────────
(
  '11111111-0005-0001-0001-000000000005',
  'Brakes and Tire Safety',
  'How to inspect brakes and tires during pre-trip, warning signs of failure, and how to respond to a tire blowout while driving.',
  'brakes_tires', 40, 12,
  'https://www.youtube.com/embed/rMZwffPGAiQ?rel=0&modestbranding=1',
  5, true,
  '[
    {"question":"The minimum brake lining thickness before a truck is placed out of service is:","options":["Less than 1/4 inch","Less than 1/8 inch","Less than 1/16 inch","Less than 1/2 inch"],"correct":1,"explanation":"Brake lining less than 1/4 inch at the shoe center must be replaced -- the vehicle is out of service."},
    {"question":"If your truck starts to pull to one side during braking, this likely indicates:","options":["Wet roads","A brake out of adjustment or a brake defect","Normal behavior for a loaded truck","Low air pressure in one tire only"],"correct":1,"explanation":"Pulling during braking is a sign of brake imbalance -- one side is doing more work, which can cause a jackknife."},
    {"question":"The minimum tread depth for front steer tires is:","options":["2/32 inch","4/32 inch","8/32 inch","6/32 inch"],"correct":1,"explanation":"Front steer tires require a minimum of 4/32 inch tread depth. All other tires require 2/32 inch minimum."},
    {"question":"If a rear tire blows out while driving, you should:","options":["Brake hard immediately","Steer toward the blowout side and brake hard","Hold the wheel firmly, ease off the throttle, and slow gradually","Swerve to the opposite lane"],"correct":2,"explanation":"A rear blowout requires holding the wheel steady, gradually reducing speed, and pulling over safely -- hard braking can cause a jackknife."}
  ]'::jsonb
),

-- ── Module 6: Distracted Driving ────────────────────────────────────────
(
  '11111111-0006-0001-0001-000000000006',
  'Distracted Driving and Cell Phone Policy',
  'The dangers of distracted driving for CDL holders, federal cell phone regulations, and company policy on device use.',
  'safe_driving', 30, 8,
  'https://www.youtube.com/embed/ufWY2V6_OLY?rel=0&modestbranding=1',
  6, true,
  '[
    {"question":"Under FMCSA regulations, commercial drivers are prohibited from:","options":["Using any Bluetooth device","Holding and using a handheld phone while driving","Talking on the phone entirely","Using GPS navigation"],"correct":1,"explanation":"FMCSA prohibits holding and using a handheld mobile phone while operating a commercial motor vehicle."},
    {"question":"The fine for a first-time handheld phone violation for a CMV driver can be up to:","options":["$500","$2,750","$5,000","$10,000"],"correct":1,"explanation":"First-time fines can reach $2,750 for the driver and $11,000 for the motor carrier."},
    {"question":"Reaching for a moving object while driving increases crash risk by:","options":["Twice","Three times","Nine times","Twenty times"],"correct":2,"explanation":"Research shows reaching for a moving object increases crash risk nine times compared to attentive driving."},
    {"question":"If you need to make a call while driving, you should:","options":["Use speakerphone held at arm length","Use a single-button, hands-free device mounted within reach","Pull over safely, then make the call","Text instead"],"correct":1,"explanation":"FMCSA allows hands-free, single-button activation devices that are mounted and reachable without leaning or reaching."}
  ]'::jsonb
),

-- ── Module 7: Getting Started with Motive ELD ───────────────────────────
(
  '11111111-0007-0001-0001-000000000007',
  'Getting Started with Motive ELD',
  'Set up your Motive ELD app, connect to the truck, and understand the basics of electronic logging before your first trip.',
  'hos_eld', 30, 10,
  'https://www.youtube.com/embed/t7debXI7icA?rel=0&modestbranding=1',
  7, true,
  '[
    {"question":"What is the first step when starting the Motive ELD app at the beginning of a shift?","options":["Start driving immediately","Log in and verify your duty status","Skip setup if you drove yesterday","Call dispatch"],"correct":1,"explanation":"Always log in and confirm your duty status before moving the truck."},
    {"question":"The Motive ELD automatically records drive time when:","options":["Dispatch calls you","The truck moves above 5 mph","You manually enter it","You close the app"],"correct":1,"explanation":"The ELD begins recording driving time automatically once the truck exceeds 5 mph."},
    {"question":"If your ELD malfunctions during a trip, you should:","options":["Stop the truck and wait for repair","Keep paper logs and notify dispatch","Ignore the malfunction and continue","Call Motive support and wait at a truck stop"],"correct":1,"explanation":"If the ELD malfunctions, switch to paper logs immediately and notify your fleet manager."},
    {"question":"Before starting a trip, you should verify that your ELD is:","options":["Connected to the vehicle and showing correct vehicle info","Any color on the status screen","Showing at least 50% battery","Connected to WiFi only"],"correct":0,"explanation":"Always verify the ELD is connected to the vehicle diagnostic port and shows the correct vehicle information."}
  ]'::jsonb
),

-- ── Module 8: Creating and Managing ELD Logs ────────────────────────────
(
  '11111111-0008-0001-0001-000000000008',
  'Creating and Managing ELD Logs',
  'How to start a drive, switch duty status, add annotations, and review your logs to avoid violations.',
  'hos_eld', 40, 12,
  'https://player.vimeo.com/video/1221147277',
  8, true,
  '[
    {"question":"When do you need to change your duty status in the Motive app?","options":["Only at the end of the day","Every time your duty status changes","Once per week","Only when driving"],"correct":1,"explanation":"You must update your duty status in real time every time it changes -- driving, on duty not driving, off duty, or sleeper berth."},
    {"question":"What duty status should you select when doing pre-trip inspection?","options":["Off Duty","Sleeper Berth","On Duty Not Driving","Personal Conveyance"],"correct":2,"explanation":"Pre-trip inspection is work time, so it must be logged as On Duty Not Driving."},
    {"question":"How many days of logs must you keep available for DOT review?","options":["3 days","5 days","8 days (today plus previous 7)","30 days"],"correct":2,"explanation":"Drivers must have 8 days of logs available: the current day plus the previous 7 days."},
    {"question":"Adding notes or annotations to your ELD logs is important because:","options":["It is optional and rarely needed","It explains exceptions or unusual events that could otherwise appear as violations","It replaces required signatures","It increases your pay"],"correct":1,"explanation":"Annotations explain why a log looks unusual -- such as adverse driving conditions -- and protect you during an inspection."},
    {"question":"Editing a certified ELD log requires:","options":["Any driver in the system","Only the original driver, with a reason for the change","No approval and can be done at any time","Fleet manager approval only"],"correct":1,"explanation":"Only the driver who certified the log can propose edits, and a reason for each change is required."}
  ]'::jsonb
),

-- ── Module 9: DVIR (Driver Vehicle Inspection Report) ───────────────────
(
  '11111111-0009-0001-0001-000000000009',
  'DVIR - Driver Vehicle Inspection Report',
  'How to complete a pre-trip and post-trip DVIR in the Motive app, document defects properly, and review previous reports.',
  'pre_trip', 40, 10,
  'https://www.youtube.com/embed/FXSEeLV1bfQ?rel=0&modestbranding=1',
  9, true,
  '[
    {"question":"How often must a DVIR be completed?","options":["Once per week","Before and after each trip","Only when there is a visible problem","Once per month"],"correct":1,"explanation":"A DVIR is required at the start (pre-trip) and end (post-trip) of every trip."},
    {"question":"If defects are found on a DVIR, the truck can be used when:","options":["The driver decides it is safe","A certified mechanic declares it safe to operate","The defect is minor in appearance","Dispatch approves it verbally"],"correct":1,"explanation":"Defects must be reviewed by a qualified mechanic who either repairs them or certifies they do not affect safe operation."},
    {"question":"The previous driver DVIR must be reviewed:","options":["After completing the pre-trip inspection","Before the driver begins the trip","At the end of the day","Only if defects were noted"],"correct":1,"explanation":"Reviewing the previous DVIR before your trip ensures you are aware of any reported defects and their status."},
    {"question":"Which section of the DVIR covers the trailer?","options":["Engine section","Cab section","Trailer section (separate from tractor)","There is no trailer section"],"correct":2,"explanation":"The DVIR has separate sections for the tractor and each trailer to ensure all units are properly inspected."}
  ]'::jsonb
),

-- ── Module 10: Roadside Inspection ──────────────────────────────────────
(
  '11111111-0010-0001-0001-000000000010',
  'Roadside Inspection',
  'What to expect during a DOT roadside inspection, what documents to have ready, and how to use Roadside Inspection Mode in Motive.',
  'safe_driving', 40, 10,
  'https://player.vimeo.com/video/1180563724',
  10, true,
  '[
    {"question":"When a DOT officer signals you to pull over, you should:","options":["Pull over and call dispatch before stopping","Drive to the nearest truck stop","Pull over safely and promptly, then have documents ready","Ask the officer for identification first"],"correct":2,"explanation":"Pull over safely and promptly. Be cooperative. Have all documents organized and ready to present."},
    {"question":"Which documents are required during a roadside inspection?","options":["CDL only","CDL and registration only","CDL, medical certificate, registration, operating authority, and ELD logs","Just the ELD printout"],"correct":2,"explanation":"You must be able to provide your CDL, current medical certificate, vehicle registration, operating authority, and last 8 days of logs."},
    {"question":"If the officer places your truck out of service, you must:","options":["Drive to the nearest repair shop","Continue to destination and repair there","Not move the vehicle until the violation is corrected","Call dispatch and ask permission to continue"],"correct":2,"explanation":"An out-of-service order means the vehicle must not move until the cited violations are corrected by a qualified mechanic."},
    {"question":"The Motive Roadside Inspection mode allows a DOT officer to:","options":["Edit your logs","View a read-only version of your logs without accessing other features","Delete violations","Access your personal information"],"correct":1,"explanation":"Roadside Inspection mode gives the officer a read-only view of your ELD logs without exposing other app features."}
  ]'::jsonb
),

-- ── Module 11: Form and Manner ───────────────────────────────────────────
(
  '11111111-0011-0001-0001-000000000011',
  'Form and Manner Compliance',
  'Understanding form and manner violations in ELD logs, what triggers them, and how to certify your logs correctly each day.',
  'hos_eld', 30, 8,
  'https://player.vimeo.com/video/814412625',
  11, true,
  '[
    {"question":"A form and manner violation occurs when:","options":["The truck is overweight","Logs are missing required information or are not properly certified","The GPS signal is lost","The engine is not running"],"correct":1,"explanation":"Form and manner violations are about the quality and completeness of log entries -- missing info, unsigned logs, or incorrect format."},
    {"question":"Which is an example of a form and manner violation?","options":["Driving at the speed limit","Missing a required signature or certification on the log","Taking a full 10-hour rest break","Changing duty status correctly"],"correct":1,"explanation":"An unsigned or uncertified log is one of the most common form and manner violations during inspections."},
    {"question":"To avoid form and manner violations, drivers should:","options":["Only check logs when stopped by DOT","Review and certify their logs at the end of each day","Ask dispatch to manage their logs","Ignore small errors if they do not affect hours"],"correct":1,"explanation":"Certifying logs daily ensures all entries are complete, accurate, and signed before they are audited."},
    {"question":"How long does a driver have to certify the previous day logs?","options":["24 hours","48 hours","7 days","By end of the current shift"],"correct":0,"explanation":"Drivers should certify the previous day logs within 24 hours. Delays can result in form and manner violations."}
  ]'::jsonb
),

-- ── Module 12: Drug and Alcohol Policy ──────────────────────────────────
(
  '11111111-0012-0001-0001-000000000012',
  'Drug and Alcohol Policy',
  'DOT drug and alcohol testing requirements for CDL drivers, BAC limits, post-accident testing timelines, and return-to-duty process.',
  'safe_driving', 40, 12,
  'https://www.youtube.com/embed/d0pOyn0m624?rel=0&modestbranding=1',
  12, true,
  '[
    {"question":"The DOT blood alcohol concentration (BAC) limit for commercial drivers is:","options":["0.08%","0.04%","0.02%","Any detectable amount"],"correct":1,"explanation":"The DOT limit for CMV drivers is 0.04% BAC -- half the limit for regular drivers -- because of the safety responsibility involved."},
    {"question":"After a serious accident, the post-accident alcohol test must be completed within:","options":["2 hours (as soon as possible, up to 8 hours)","24 hours","48 hours","72 hours"],"correct":0,"explanation":"Alcohol testing must be done as soon as possible after the accident, no later than 8 hours. Drug testing must occur within 32 hours."},
    {"question":"If a driver tests positive for drugs, they must:","options":["Take a second test and average the results","Continue working with restrictions for 30 days","Be removed from safety-sensitive duties until cleared by a Substance Abuse Professional","Take 48 hours off and resume normal duties"],"correct":2,"explanation":"A positive test requires immediate removal from safety-sensitive duties. Return requires evaluation and clearance by a DOT-qualified Substance Abuse Professional."},
    {"question":"Random drug testing means:","options":["Tests happen only after an incident","Drivers are selected randomly throughout the year with no advance notice","Only new drivers are tested","Tests happen once per year"],"correct":1,"explanation":"Random testing uses a scientifically valid selection method throughout the year. Drivers must test immediately when selected."},
    {"question":"Which substances are included in the standard DOT 5-panel drug test?","options":["Alcohol only","Marijuana, cocaine, opiates, phencyclidine (PCP), and amphetamines","All prescription medications","Only illegal street drugs"],"correct":1,"explanation":"The DOT 5-panel tests for marijuana, cocaine, opiates/opioids, phencyclidine (PCP), and amphetamines/methamphetamines."}
  ]'::jsonb
),

-- ── Module 13: Pre-Trip: Lights Check ───────────────────────────────────
(
  '11111111-0013-0001-0001-000000000013',
  'Pre-Trip: Lights Inspection',
  'How to test all required lights on the tractor and trailer during pre-trip inspection, and what to do if a light is out.',
  'pre_trip', 30, 8,
  'https://www.youtube.com/embed/dLCsVHdrGf0?rel=0&modestbranding=1',
  13, true,
  '[
    {"question":"During a lights check, which lights must be tested on the tractor?","options":["Only headlights and brake lights","Headlights, brake lights, turn signals, clearance lights, and marker lights","Only headlights","Headlights and reverse lights only"],"correct":1,"explanation":"All lights must be checked: headlights (high and low), brake lights, turn signals, clearance lights, and marker lights on both tractor and trailer."},
    {"question":"What should you do if a clearance light is out during pre-trip?","options":["Drive carefully during daylight hours only","Cover it with reflective tape","Report it and do not drive until repaired or cleared by maintenance","Ignore it if the other lights work"],"correct":2,"explanation":"Any inoperative required light must be reported on the DVIR. Do not operate the vehicle until it is repaired or maintenance clears it."},
    {"question":"Why must you test brake lights before every trip?","options":["They are decorative","They warn following drivers when you are slowing down, which is critical at highway speed","They are only needed at night","They are tested by the shop, not the driver"],"correct":1,"explanation":"Rear-end collisions are among the most dangerous for truck drivers. Working brake lights are a critical safety item."},
    {"question":"To check trailer lights during a solo pre-trip, the most efficient method is:","options":["Guess based on their age","Use a trailer light tester cord or ask a nearby driver to confirm","Walk to the rear repeatedly while cycling through functions","Call dispatch to check the camera"],"correct":1,"explanation":"A trailer light tester allows a solo driver to verify all trailer lights without walking back and forth repeatedly."}
  ]'::jsonb
),

-- ── Module 14: Pre-Trip: Tires Check ────────────────────────────────────
(
  '11111111-0014-0001-0001-000000000014',
  'Pre-Trip: Tires Inspection',
  'What to look for when inspecting tires during pre-trip, minimum tread depths, inflation requirements, and blowout risk signs.',
  'brakes_tires', 30, 8,
  'https://www.youtube.com/embed/EudrBA7UzdI?rel=0&modestbranding=1',
  14, true,
  '[
    {"question":"The minimum tread depth for front steer tires is:","options":["2/32 inch","4/32 inch","6/32 inch","8/32 inch"],"correct":1,"explanation":"Front steer tires require 4/32 inch minimum tread depth. Drive and trailer tires require 2/32 inch minimum."},
    {"question":"During a tire inspection, you should look for:","options":["Pressure only","Visible damage only","Cuts, bulges, worn tread, objects between duals, and correct inflation","Tread depth only"],"correct":2,"explanation":"A complete tire inspection checks for cuts, bulges, abnormal wear, objects lodged between duals, and proper inflation."},
    {"question":"Objects lodged between dual tires are dangerous because:","options":["They are against company policy","They cause uneven wear and heat buildup that can lead to a blowout","They are only a problem on long trips","They reduce fuel economy slightly"],"correct":1,"explanation":"Objects between duals trap heat, cause uneven pressure distribution, and dramatically increase blowout risk at highway speeds."},
    {"question":"A bulge or bubble on the sidewall of a tire indicates:","options":["Normal aging of the rubber","Structural damage to the tire -- it must be replaced immediately","Low air pressure only","The tire needs rotation"],"correct":1,"explanation":"A sidewall bulge means the internal structure is damaged. The tire can fail without warning and must be replaced before the truck moves."}
  ]'::jsonb
),

-- ── Module 15: Safe Speed Management ────────────────────────────────────
(
  '11111111-0015-0001-0001-000000000015',
  'Safe Speed Management',
  'How to choose safe speeds for conditions, understand the physics of large trucks, and adjust for curves, grades, and weather.',
  'safe_driving', 40, 10,
  'https://www.youtube.com/embed/jPlGE7NW09c?rel=0&modestbranding=1',
  15, true,
  '[
    {"question":"The safest approach when entering a curve with a loaded trailer is:","options":["Speed up to maintain momentum through the curve","Brake hard inside the curve","Reduce speed before entering the curve, not during it","Keep the same highway speed"],"correct":2,"explanation":"Braking inside a curve shifts weight dangerously and can cause a rollover. Slow down before the curve, then maintain steady speed."},
    {"question":"In wet conditions, you should reduce speed by approximately:","options":["5 mph below posted limit","One-third of your normal speed","One-half of your normal speed","10 mph below posted limit"],"correct":1,"explanation":"Wet roads can triple stopping distance. Reducing speed by one-third is a standard rule of thumb for safe wet-weather driving."},
    {"question":"The most common cause of speed-related truck crashes is:","options":["Engine failure","Driving too fast for conditions, even below the posted limit","Other driver error only","Weather events alone"],"correct":1,"explanation":"Posted speed limits are for ideal conditions. Speed-related crashes often occur when drivers go the limit in fog, rain, or on curves."},
    {"question":"When descending a long steep grade, which technique should you use?","options":["Use the service brakes continuously to control speed","Shift to a lower gear before descending and use engine braking","Coast in neutral to save fuel","Apply the trailer brakes only"],"correct":1,"explanation":"Select a lower gear before the descent. Use engine braking (Jake brake if equipped) to control speed. Heavy continuous service brake use causes brake fade."}
  ]'::jsonb
),

-- ── Module 16: Unidentified Driving Events ──────────────────────────────
(
  '11111111-0016-0001-0001-000000000016',
  'Unidentified Driving Events',
  'What unidentified driving events are, why they occur, how to claim or reject them in Motive, and what happens if they are not resolved.',
  'hos_eld', 30, 8,
  'https://helpcenter.gomotive.com/hc/en-us/p/video-library-category?role=fleet-admins&category=how-to&video=vim-073',
  16, true,
  '[
    {"question":"An unidentified driving event occurs when:","options":["The GPS loses signal","The truck moves but no driver is logged in or identified","The driver takes a wrong turn","The ELD battery is low"],"correct":1,"explanation":"When the truck moves above 5 mph with no driver logged in, the ELD records it as an unidentified driving event that must be resolved."},
    {"question":"Who is responsible for reviewing and claiming unidentified driving events?","options":["The fleet manager only","The driver who was operating the truck during that time","Any available driver","Dispatch can assign them randomly"],"correct":1,"explanation":"The driver who operated the truck during that time must accept the driving event. Accepting someone else event is falsification of records."},
    {"question":"If you cannot identify a driving event as yours, you should:","options":["Accept it to avoid a company penalty","Ignore it and let it expire","Reject it and notify your fleet manager with an explanation","Transfer it to the previous driver"],"correct":2,"explanation":"Rejecting an event you did not drive is correct. Notify your fleet manager so they can investigate and assign it properly."},
    {"question":"Unresolved unidentified driving events can result in:","options":["No consequences","HOS violations and form and manner violations on the carrier record","Only a warning email","A GPS recalibration fee"],"correct":1,"explanation":"Unresolved events create HOS and form and manner issues for the carrier. Carriers are responsible for ensuring all drive time is attributed to a driver."}
  ]'::jsonb
)

ON CONFLICT (id) DO UPDATE SET
  title            = EXCLUDED.title,
  description      = EXCLUDED.description,
  category         = EXCLUDED.category,
  points_value     = EXCLUDED.points_value,
  duration_minutes = EXCLUDED.duration_minutes,
  video_url        = EXCLUDED.video_url,
  sort_order       = EXCLUDED.sort_order,
  is_active        = EXCLUDED.is_active,
  quiz             = EXCLUDED.quiz;
