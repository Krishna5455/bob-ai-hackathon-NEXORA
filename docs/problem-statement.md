# Problem Statement: Lower-Limb Venous Rehabilitation & Longitudinal Clinical Monitoring

> **Safety Notice:** *Decision support only — clinician judgement required. AI output does not constitute a diagnosis, treatment recommendation, or prescription.*

---

## 1. Clinical Context & Domain Background

Lower-limb venous diseases—encompassing Chronic Venous Insufficiency (CVI), deep vein thrombosis (DVT) recovery, post-thrombotic syndrome (PTS), and post-surgical venous rehabilitation—affect millions of patients worldwide. Management of these conditions relies heavily on consistent, long-term rehabilitation regimens, including compression therapy, structured calf-muscle activation protocols, and neuromuscular electrical stimulation (NMES) exercises.

Effective rehabilitation is designed to augment the natural calf-muscle venous pump mechanism, reducing venous hypertension, promoting upward venous blood return, and preventing chronic complications such as debilitating venous ulcers, chronic skin alterations, and recurrent thrombotic events.

---

## 2. The Core Problem

Despite the well-established benefits of structured venous rehabilitation, clinical recovery pathways suffer from major operational and observational blind spots:

1. **Poor Therapy Adherence in Home Settings:**
   Rehabilitation protocols typically require daily or multi-session weekly therapy over 4 to 12 weeks. However, patient compliance drops significantly outside supervised clinical environments due to discomfort, lack of immediate feedback, or forgetfulness.
2. **Unmonitored Symptom Fluctuations:**
   Patients experience fluctuating physical symptoms across four primary dimensions:
   - **Pain** (local calf tenderness, aching upon standing)
   - **Swelling / Oedema** (fluid accumulation in ankles and lower calf)
   - **Heaviness** (sensation of gravitational drag after prolonged standing)
   - **Fatigue** (muscle exhaustion during or following daily activity)
   Currently, these symptoms are reported retrospectively during infrequent outpatient visits, subject to recall bias and missed early warning signs.
3. **Sparse Follow-Ups & Disconnected Data:**
   Clinicians typically review patients every 4 to 8 weeks. In between appointments, clinicians have zero visibility into whether sessions were completed, aborted prematurely due to discomfort, or skipped entirely.
4. **Cognitive Overload in Pattern Recognition:**
   When retrospective logs are available, clinicians must manually sift through disjointed notes or paper diaries to connect symptom trajectories with therapy compliance. Identifying subtle downward trends or non-responders across large patient panels is time-consuming and error-prone.

---

## 3. Who is Affected (Target Users)

- **Vascular Surgeons & Angiologists:** Require objective longitudinal tracking to assess recovery post-venous intervention, stent placement, or bypass surgery.
- **Physical Therapists & Rehabilitation Specialists:** Need granular session-by-session compliance data and discomfort ratings to tailor exercise protocols and NMES stimulation intensity.
- **Outpatient Clinical Care Teams & Nurses:** Need automated cohort prioritization and risk stratification to proactively reach out to deteriorating or non-adherent patients before acute readmission is required.
- **Rehabilitation Patients:** Benefit indirectly through structured digital oversight, clearer adherence goals, and clinician-guided protocol adjustments.

---

## 4. Why a Structured Digital Monitoring Layer is Needed

A specialized digital monitoring and clinical decision support platform transforms venous rehabilitation by:
- **Aggregating Longitudinal Session Metrics:** Digitally capturing session frequency, protocol completion percentages, and patient-reported discomfort.
- **Providing Multi-Symptom Visualizations:** Graphing trajectories of pain, oedema, heaviness, and fatigue alongside therapy compliance.
- **Automated Clinical Risk Stratification:** Utilizing rule-based algorithms to detect early warning signs (e.g., sudden adherence drops, escalating pain scores, or recurrent incomplete sessions).
- **Augmenting Clinicians with Generative AI:** Synthesizing complex multi-week recovery histories into grounded clinical summaries using **IBM watsonx.ai (IBM Granite 4 H Small)** to support timely clinician decisions.

---

## 5. Prototype Scope & Limitations

- **Synthetic & Simulated Data:** The current platform is a hackathon proof-of-concept operating on synthetic patient records and simulated rehabilitation sessions.
- **Future Physical Wearable Integration:** The physical Veno-Pump wearable calf sleeve (with pneumatic compression and NMES actuators) is a proposed hardware concept and is **not** physically connected or implemented in this software prototype.
- **Clinical Decision Support Only:** The system is an assistive clinical intelligence tool, not an autonomous diagnostic or prescriptive system. It does not replace professional clinical evaluation or protocol validation.
