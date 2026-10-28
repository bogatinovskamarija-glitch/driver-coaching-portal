-- ============================================================
-- Seed coaching modules with videos + quizzes
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING
-- ============================================================

INSERT INTO public.coaching_modules
  (id, title, description, category, sort_order, youtube_video_id, points_value, duration_minutes, is_active, quiz)
VALUES

-- ── 1. Pre-Trip Inspection ────────────────────────────────
(
  '11111111-0001-0001-0001-000000000001',
  'CDL Pre-Trip Inspection Walkthrough',
  'Step-by-step walkthrough of a complete CDL pre-trip inspection. Know exactly what to check before every shift.',
  'pre_trip', 1,
  'demoVideoId1',
  50, 12, true,
  '[
    {
      "question": "During a pre-trip inspection, which of the following should you check on the tires?",
      "options": ["Only the front tires", "Tread depth, inflation pressure, and visible damage on all tires", "Just look for visible cuts", "Tire brand and manufacturer date only"],
      "correct": 1,
      "explanation": "All tires must be checked for tread depth (minimum 4/32 on steering, 2/32 on others), proper inflation, and no visible damage."
    },
    {
      "question": "You notice a small oil leak under the engine during pre-trip. What should you do?",
      "options": ["Ignore it — a small leak is normal", "Note it but drive anyway", "Report it to maintenance before driving", "Add more oil and continue"],
      "correct": 2,
      "explanation": "Any leak must be reported to maintenance before the vehicle is operated. Driving with a leak can lead to engine damage or fire."
    },
    {
      "question": "How should you test your brakes during a pre-trip?",
      "options": ["Apply service brakes at highway speed", "With the truck stationary, build air pressure, apply brakes and hold 1 minute — drop must be under 3 PSI", "Just pump the pedal a few times", "No brake test is required before driving"],
      "correct": 1,
      "explanation": "A static brake test: engine off, build air to governor cut-off, turn off engine, apply service brakes and hold for 1 minute. Pressure drop should be under 3 PSI."
    },
    {
      "question": "Which lights must be working before you can legally operate a CMV?",
      "options": ["Only headlights", "Headlights, taillights, brake lights, turn signals, clearance lights, and marker lights", "Headlights and brake lights only", "Lights are optional during daytime"],
      "correct": 1,
      "explanation": "All required lights must be operational. A single non-working light can result in an out-of-service order during a DOT inspection."
    },
    {
      "question": "What is the minimum tread depth required on the front steering axle tires?",
      "options": ["2/32 inch", "4/32 inch", "6/32 inch", "8/32 inch"],
      "correct": 1,
      "explanation": "Federal regulations require a minimum of 4/32 inch on steering axle tires and 2/32 inch on all other tires."
    }
  ]'::jsonb
),

-- ── 2. HOS & ELD Compliance ───────────────────────────────
(
  '11111111-0002-0002-0002-000000000002',
  'Hours of Service (HOS) Rules',
  'Understand the 11-hour driving limit, 14-hour window, 30-minute break, and 70-hour/8-day cycle to stay compliant and avoid violations.',
  'hos_eld', 2,
  'demoVideoId2',
  50, 15, true,
  '[
    {
      "question": "Under the property-carrying driver rules, what is the maximum driving time allowed after 10 consecutive hours off duty?",
      "options": ["10 hours", "11 hours", "12 hours", "14 hours"],
      "correct": 1,
      "explanation": "Property-carrying drivers may drive a maximum of 11 hours after taking 10 consecutive hours off duty."
    },
    {
      "question": "What is the 14-hour rule?",
      "options": ["You must drive 14 hours before taking a break", "You may not drive beyond the 14th hour after coming on duty, following 10 consecutive hours off duty", "You must be off duty within 14 hours of leaving the yard", "You can work a maximum of 14 hours including all breaks"],
      "correct": 1,
      "explanation": "The 14-hour window starts when you come on duty. You cannot drive after the 14th hour, even if you have driving hours remaining."
    },
    {
      "question": "When is a 30-minute rest break required?",
      "options": ["After every 4 hours of driving", "After 8 hours of driving time without a break of at least 30 minutes", "Every time you stop for fuel", "After driving 500 miles"],
      "correct": 1,
      "explanation": "You must take a 30-minute break before or at the 8-hour mark of driving time. The break must be spent off duty or in the sleeper berth."
    },
    {
      "question": "Under the 70-hour / 8-day rule, a driver may not drive after accumulating how many on-duty hours in the past 8 days?",
      "options": ["60 hours", "65 hours", "70 hours", "80 hours"],
      "correct": 2,
      "explanation": "A driver using the 8-day cycle may not drive after reaching 70 total on-duty hours in any 8-consecutive-day period."
    },
    {
      "question": "What must you do to reset your 70-hour clock?",
      "options": ["Take a 10-hour rest break", "Take a 24-hour rest break", "Take a 34-hour restart that includes two periods from 1:00 am to 5:00 am", "Take a 30-minute break"],
      "correct": 2,
      "explanation": "A 34-hour restart resets your weekly 70-hour limit. The restart period must include two consecutive 1:00 am to 5:00 am periods."
    }
  ]'::jsonb
),

-- ── 3. Safe Following Distance ────────────────────────────
(
  '11111111-0003-0003-0003-000000000003',
  'Safe Following Distance & Speed Management',
  'Learn the proper following distance for commercial vehicles, why speeding is dangerous, and how to manage speed in different conditions.',
  'safe_driving', 3,
  'demoVideoId3',
  40, 10, true,
  '[
    {
      "question": "What is the minimum following distance recommended for a commercial truck traveling at 55 mph in good conditions?",
      "options": ["2 seconds", "4 seconds", "At least one second per 10 feet of vehicle length (approximately 6-7 seconds at 55 mph)", "100 feet"],
      "correct": 2,
      "explanation": "At 55 mph a loaded truck needs over 400 feet to stop. Use at least one second per 10 feet of vehicle length — for a 60-foot truck at 55 mph that is 7 or more seconds."
    },
    {
      "question": "How does your stopping distance change in wet or slippery conditions?",
      "options": ["It stays the same", "It roughly doubles — increase your following distance accordingly", "It is slightly longer — add 1 second", "Wet roads actually improve braking"],
      "correct": 1,
      "explanation": "Wet roads roughly double your stopping distance. In snow or ice conditions stopping distance can increase 6 to 10 times compared to dry pavement."
    },
    {
      "question": "You are driving at 65 mph and need to reduce speed on a downgrade. What is the safest approach?",
      "options": ["Apply brakes continuously until the bottom", "Use engine braking (lower gear) and apply steady moderate brake pressure", "Let the truck coast freely to save fuel", "Speed up to clear the grade faster"],
      "correct": 1,
      "explanation": "Continuous braking overheats brake drums and causes brake fade. Use a lower gear to let the engine absorb speed, supplemented with steady brake applications."
    },
    {
      "question": "A Motive speeding alert fires when a driver exceeds the posted speed limit by more than what threshold (company policy)?",
      "options": ["3 mph", "5 mph", "10 mph", "15 mph"],
      "correct": 1,
      "explanation": "Company policy flags events at 5 mph over the posted limit. Consistent speeding events result in coaching sessions and point deductions."
    }
  ]'::jsonb
),

-- ── 4. Backing & Maneuvering ──────────────────────────────
(
  '11111111-0004-0004-0004-000000000004',
  'Safe Backing & Tight Maneuvering',
  'Best practices for backing into docks, navigating tight lots, and using a spotter. Most accidents happen at slow speed — learn to prevent them.',
  'safe_driving', 4,
  'demoVideoId4',
  40, 10, true,
  '[
    {
      "question": "When should you get out and look (G.O.A.L.) before backing?",
      "options": ["Only when backing at night", "Every time before you back, to check clearances and hazards behind you", "Only at unfamiliar docks", "Never — use your mirrors instead"],
      "correct": 1,
      "explanation": "G.O.A.L. is one of the most important backing habits. Hazards change — always walk the area behind your truck before every backing maneuver."
    },
    {
      "question": "When using a spotter during backing, what should you do if you lose sight of them?",
      "options": ["Keep backing — you were lined up correctly", "Slow down but continue", "Stop immediately and do not move until contact is re-established", "Sound the horn and continue"],
      "correct": 2,
      "explanation": "If you cannot see your spotter, stop immediately. A spotter you cannot see cannot warn you of a hazard. Re-establish communication before moving."
    },
    {
      "question": "Which side is the blind side when backing?",
      "options": ["The driver side (left)", "The passenger side (right)", "Directly behind the trailer", "There is no blind side with mirrors"],
      "correct": 1,
      "explanation": "The passenger (right) side is the blind side. Always favor the driver side when choosing where to position for a backing maneuver."
    }
  ]'::jsonb
),

-- ── 5. Brakes & Tire Safety ───────────────────────────────
(
  '11111111-0005-0005-0005-000000000005',
  'Brakes & Tire Safety',
  'Understand air brake systems, recognize signs of brake failure, and know the tire rules that keep you roadside-inspection compliant.',
  'brakes_tires', 5,
  'demoVideoId5',
  40, 12, true,
  '[
    {
      "question": "What should you do if your low air pressure warning light comes on while driving?",
      "options": ["Keep driving to the nearest truck stop", "Immediately pull off the road safely and stop — do not continue until the problem is fixed", "Pump the brakes to build pressure", "It is just a sensor — ignore it"],
      "correct": 1,
      "explanation": "The warning activates at approximately 60 PSI. Below 40 PSI the spring brakes apply automatically. Pull over and stop immediately."
    },
    {
      "question": "What is brake fade and what causes it?",
      "options": ["Brakes getting stronger over time due to wear", "Reduced braking power caused by overheated brake drums from continuous application on downgrades", "Brakes that squeak in cold weather", "Brakes that are out of adjustment"],
      "correct": 1,
      "explanation": "Brake fade happens when drums overheat from continuous braking. Always use engine braking on grades and apply brakes in steady, firm applications."
    },
    {
      "question": "A tire blows out on the rear drive axle while you are driving. What is the correct response?",
      "options": ["Slam on the brakes immediately", "Keep a firm grip on the wheel, do NOT brake hard, let the vehicle slow naturally, then ease to the shoulder", "Accelerate to maintain control", "Turn the wheel sharply to stay in your lane"],
      "correct": 1,
      "explanation": "Sudden braking after a blowout can cause a jackknife or rollover. Hold the wheel firmly, maintain direction, allow the truck to slow, and ease off the road."
    },
    {
      "question": "During a DOT roadside inspection, a tire is found to have a tread depth of 3/32 inch on the front steering axle. What happens?",
      "options": ["A warning is issued but you can continue", "The vehicle is placed out of service immediately", "You are fined but can continue driving", "Nothing — 3/32 is above the minimum"],
      "correct": 1,
      "explanation": "Steering axle tires require a minimum of 4/32 inch. A 3/32 inch reading is below the legal limit and results in an immediate out-of-service order."
    }
  ]'::jsonb
),

-- ── 6. Distracted Driving ─────────────────────────────────
(
  '11111111-0006-0006-0006-000000000006',
  'Distracted Driving & Cell Phone Policy',
  'FMCSA bans on handheld phones, the real crash risk of distracted driving, and how to stay focused on long hauls.',
  'safe_driving', 6,
  'demoVideoId6',
  30, 8, true,
  '[
    {
      "question": "Under FMCSA regulations, which of the following is a driver allowed to do with a mobile phone while driving a CMV?",
      "options": ["Send a quick text at a red light", "Use a hands-free device mounted within reach that requires only one button press to activate", "Hold the phone with one hand and talk", "Browse navigation apps freely"],
      "correct": 1,
      "explanation": "FMCSA prohibits holding, dialing, or texting with a handheld phone. Drivers may use a hands-free device operable with a single button press while properly restrained."
    },
    {
      "question": "What is the maximum fine for a first-offense handheld cell phone violation for a CMV driver?",
      "options": ["$500", "$1,000", "$2,750", "$5,000"],
      "correct": 2,
      "explanation": "FMCSA fines can reach $2,750 per offense for drivers and up to $11,000 for motor carriers who allow or require drivers to use handheld devices."
    },
    {
      "question": "Texting while driving at 55 mph means your eyes are off the road for approximately how long?",
      "options": ["1 second", "4.6 seconds — the length of a football field", "Less than half a second", "10 seconds"],
      "correct": 1,
      "explanation": "Research shows the average text takes 4.6 seconds. At 55 mph you travel 371 feet completely blind — more than the length of a football field."
    }
  ]'::jsonb
)

ON CONFLICT (id) DO NOTHING;
