"""
ANALYSIS ENGINE — Indonesia Energy Narrative Monitor
=====================================================
Cluster definitions are LOCKED here. They never change based on data.
To add/modify a cluster, you must explicitly edit this file.

Clusters:
  A — Broken Promise       (political accountability)
  B — Inflation Domino     (purchasing power erosion)
  C — Subsidy Migration    (Pertalite / LPG 3kg shift)
  D — Geopolitical         (Iran-Hormuz oil shock)
  F — EV / Alternatives    (energy transition signals)
  G — Political Satire     (analyst note, not primary cluster)
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, date
import google.generativeai as genai
from sklearn.metrics.pairwise import cosine_similarity

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

genai.configure(api_key=GEMINI_API_KEY)


# ── LOCKED CLUSTER DEFINITIONS ─────────────────────────────────────────────
CLUSTER_DEFS = [
    {
        "id": "A",
        "name": "Broken Promise",
        "label": "A — Broken Promise",
        "sub": "Political accountability",
        "desc": "Direct anger at government and DPR — broken campaign pledges, criticism from Commission VI members (Mufti Anam/PDIP), mockery of Minister Bahlil. Peaked Apr 21 when hike first went viral, then dropped below 10%.",
        "keywords_sm": ['broken promise','janji','dpr','mufti anam','pdip','fraksi',
                        'komisi vi','betrayal','critique','protest','amarah','marah',
                        'kecewa','tidak malu','pengkhianat','bohong','ingkar'],
        "keywords_cm": ['dpr','mufti anam','pdip','fraksi','komisi vi','amarah',
                        'marah','kecewa','tidak malu','pengkhianat','bohong','ingkar',
                        'protes','kritik'],
    },
    {
        "id": "C",
        "name": "Subsidy Migration",
        "label": "C — Subsidy Migration",
        "sub": "Pertalite / LPG 3kg shift",
        "desc": "Fear that the non-subsidy hike pushes wealthier consumers into Pertalite and 3kg LPG, draining stock meant for the poor. CM leads because government is actively messaging on this — but official framing isn't landing online.",
        "keywords_sm": ['pertalite','elpiji 3','lpg 3','gas melon','bbm subsidi',
                        'solar subsidi','subsidi bbm','subsidized fuel',
                        'beralih ke subsidi','migrasi'],
        "keywords_cm": ['pertalite','elpiji 3','lpg 3','gas melon','bbm subsidi',
                        'solar subsidi','subsidi bbm','subsidized fuel','beralih ke subsidi'],
    },
    {
        "id": "B",
        "name": "Inflation Domino",
        "label": "B — Inflation Domino",
        "sub": "Purchasing power erosion",
        "desc": "Conversation about fuel hike's chain effect on staple prices, logistics costs, SME margins, and household spending. Not about policy — about what people already feel at the market and dinner table.",
        "keywords_sm": ['daya beli','purchasing power','inflasi','inflation','domino',
                        'sembako','staple','bahan pokok','umkm','msme','logistik',
                        'minyak goreng','cooking oil','harga naik','biaya hidup'],
        "keywords_cm": ['daya beli','purchasing power','inflasi','inflation','domino',
                        'sembako','bahan pokok','umkm','msme','logistik','minyak goreng',
                        'cooking oil','harga naik','biaya hidup'],
    },
    {
        "id": "D",
        "name": "Geopolitical",
        "label": "D — Geopolitical",
        "sub": "Iran-Hormuz oil shock",
        "desc": "Links fuel hike to Iran-US-Israel conflict and Strait of Hormuz closure threat. More a media framing device than an organic public narrative — resonates with analysts, not general public.",
        "keywords_sm": ['iran','hormuz','geopolit','global oil','harga minyak dunia',
                        'world oil','crude','opec','konflik','conflict'],
        "keywords_cm": ['iran','hormuz','geopolit','global oil','harga minyak dunia',
                        'world oil','crude','opec','konflik','conflict'],
    },
    {
        "id": "F",
        "name": "EV / Alternatives",
        "label": "F — EV / Alternatives",
        "sub": "Energy transition signals",
        "desc": "Content about alternative energy options: EVs, biogas, firewood, fuel conversion. Emerges as adaptive public response to rising prices. SM far ahead of CM — a narrative slot conventional media has not filled.",
        "keywords_sm": ['ev','kendaraan listrik','electric vehicle','insentif kendaraan',
                        'kayu bakar','firewood','biogas','alternative','alternatif',
                        'transisi energi','energy transition','mobil listrik'],
        "keywords_cm": ['kendaraan listrik','electric vehicle','insentif kendaraan',
                        'kayu bakar','firewood','biogas','alternatif','transisi energi',
                        'mobil listrik'],
    },
]

SATIRE_KEYWORDS = [
    'meme','king bahlil','let bahlil cook','bahlil cook','fans of king bahlil',
    'officials will make statements','not solutions','satire','parody','humor',
    'lucu','lawak','plesetan','gimmick','bahlil late game','kocak','ngakak','receh'
]

REGION_DEFS = [
    {"name": "Jakarta",       "keywords": ['jakarta','dki','ibu kota']},
    {"name": "Jawa Timur",    "keywords": ['jawa timur','jatim','surabaya','malang','sidoarjo']},
    {"name": "Jawa Barat",    "keywords": ['jawa barat','jabar','bandung','bogor','bekasi','depok']},
    {"name": "Kalimantan",    "keywords": ['kalimantan','borneo','balikpapan','samarinda','banjarmasin','nunukan','kaltim','kaltara']},
    {"name": "Sumatera",      "keywords": ['sumatera','sumatra','medan','palembang','pekanbaru','riau','aceh','lampung']},
    {"name": "Sulawesi",      "keywords": ['sulawesi','makassar','manado','gorontalo','sulut']},
    {"name": "Bali/NTT/NTB",  "keywords": ['bali','denpasar','lombok','nusa tenggara','ntb','ntt']},
    {"name": "Papua/Maluku",  "keywords": ['papua','maluku','ambon','intan jaya','seram','ternate','malteng']},
]

ESCALATION_KEYWORDS = ['blockade','demo','mogok','antrean','kerusuhan','blokir','unjuk rasa','antri']

# ── CLUSTER ASSIGNMENT ──────────────────────────────────────────────────────
def assign_cluster(text: str, mode: str = "sm") -> str:
    t = str(text).lower()
    key = "keywords_sm" if mode == "sm" else "keywords_cm"
    for cl in CLUSTER_DEFS:
        if any(k in t for k in cl[key]):
            return cl["id"]
    return "UNCLASSIFIED"

def get_embedding(text: str):
    try:
        response = genai.embed_content(
            model="models/text-embedding-004",
            content=str(text)
        )

        return response['embedding']

    except Exception:
        return None

def semantic_cluster_match(text: str, threshold: float = 0.78):

    emb = get_embedding(text)

    if emb is None:
        return "UNCLASSIFIED"

    best_cluster = None
    best_score = 0

    for cid, cluster_emb in CLUSTER_FINGERPRINTS.items():

        score = cosine_similarity(
            [emb],
            [cluster_emb]
        )[0][0]

        if score > best_score:
            best_score = score
            best_cluster = cid

    if best_score >= threshold:
        return best_cluster

    return "UNCLASSIFIED"

CLUSTER_FINGERPRINTS = {}

for cl in CLUSTER_DEFS:

    seed_text = (
        cl["name"] + " " +
        cl["desc"] + " " +
        " ".join(cl["keywords_sm"])
    )

    emb = get_embedding(seed_text)

    if emb:
        CLUSTER_FINGERPRINTS[cl["id"]] = emb

def detect_region(text: str):
    t = str(text).lower()
    for r in REGION_DEFS:
        if any(k in t for k in r["keywords"]):
            return r["name"]
    return None

def has_escalation(text: str) -> bool:
    t = str(text).lower()
    return any(k in t for k in ESCALATION_KEYWORDS)

def is_satire(text: str) -> bool:
    t = str(text).lower()
    return any(k in t for k in SATIRE_KEYWORDS)

# ── MAIN ANALYSIS ───────────────────────────────────────────────────────────
def run_analysis(sm_raw: pd.DataFrame, cm_raw: pd.DataFrame) -> dict:
    sm = sm_raw.copy()
    cm = cm_raw.copy()

    # ── Numeric coercion
    for col in ['likes_count','comments_count','shares_count','quotes_count']:
        if col in sm.columns:
            sm[col] = pd.to_numeric(sm[col], errors='coerce').fillna(0)
    sm['engagement_score'] = (
        sm.get('likes_count', 0) * 1.0 +
        sm.get('comments_count', 0) * 2.0 +
        sm.get('shares_count', 0) * 3.0 +
        sm.get('quotes_count', 0) * 2.5
    )
    cm['AVE']   = pd.to_numeric(cm.get('AVE',   pd.Series(dtype=float)), errors='coerce').fillna(0)
    cm['Reach'] = pd.to_numeric(cm.get('Reach', pd.Series(dtype=float)), errors='coerce').fillna(0)

    # ── Dates
    sm['date'] = pd.to_datetime(sm['post_date'], errors='coerce').dt.date
    cm['date'] = pd.to_datetime(cm['Date'],      errors='coerce').dt.date

    # ── Cluster assignment
    def hybrid_cluster(text):

        # First: strict rule-based
        rule_match = assign_cluster(text, "sm")

        if rule_match != "UNCLASSIFIED":
            return rule_match

        # Second: semantic similarity
        return semantic_cluster_match(text)

    sm['cluster'] = sm['post_translation'].apply(hybrid_cluster)
    cm_text = cm['Title'].fillna('') + ' ' + cm['Hit Sentence'].fillna('')
    cm['cluster'] = cm_text.apply(lambda t: assign_cluster(t, "cm"))

    # ── Emerging candidate pool
    emerging_candidates = sm[
        sm['cluster'] == 'UNCLASSIFIED'
    ].copy()
    
    # Remove very low-engagement noise
    emerging_candidates = emerging_candidates[
        emerging_candidates['engagement_score'] > 50
    ]

    emerging_summary = []

    if len(emerging_candidates) > 0:

        top_posts = (
            emerging_candidates
            .sort_values('engagement_score', ascending=False)
            .head(5)
        )

        for _, row in top_posts.iterrows():

            prompt = f"""
    You are analyzing emerging public narratives.

    Analyze this post:

    {row['post_translation']}

    Return:
    1. Narrative title
    2. One sentence summary
    3. Why this may matter

    Keep concise.
    """

            try:
                model = genai.GenerativeModel("gemini-2.5-flash")

                response = model.generate_content(prompt)

                summary = response.text.strip()

            except Exception:
                summary = "Emerging narrative detected."

            emerging_summary.append({
                "text": row['post_translation'][:240],
                "engagement": round(row['engagement_score'], 0),
                "summary": summary
            })

    # ── Satire flag
    sm['is_satire'] = sm['post_translation'].apply(is_satire)

    # ── Region
    sm['region'] = sm['post_translation'].apply(detect_region)
    cm['region'] = cm_text.apply(detect_region)

    # ── Escalation
    sm['escalation'] = sm['post_translation'].apply(has_escalation)

    total_eng = sm['engagement_score'].sum()
    total_ave = cm['AVE'].sum() if cm['AVE'].sum() > 0 else cm['Reach'].sum()

    # ── Last updated
    all_dates = list(sm['date'].dropna()) + list(cm['date'].dropna())
    last_updated = str(max(all_dates)) if all_dates else "unknown"
    period_start = str(min(all_dates)) if all_dates else "unknown"

    # ── Cluster shares
    cluster_stats = []
    for cl in CLUSTER_DEFS:
        cid = cl["id"]
        sm_sub = sm[sm['cluster'] == cid]
        cm_sub = cm[cm['cluster'] == cid]
        sm_eng  = sm_sub['engagement_score'].sum()
        cm_ave  = cm_sub['AVE'].sum() if total_ave > 0 else cm_sub['Reach'].sum()
        sm_pct  = round(sm_eng / total_eng * 100, 1) if total_eng > 0 else 0
        cm_pct  = round(cm_ave / total_ave * 100, 1) if total_ave > 0 else 0
        gap     = round(sm_pct - cm_pct, 1)
        cluster_stats.append({
            "id":         cid,
            "name":       cl["name"],
            "label":      cl["label"],
            "sub":        cl["sub"],
            "desc":       cl["desc"],
            "sm_pct":     sm_pct,
            "cm_pct":     cm_pct,
            "gap":        gap,
            "sm_posts":   int(len(sm_sub)),
            "cm_articles":int(len(cm_sub)),
            "sm_eng":     round(sm_eng, 0),
        })
    cluster_stats.sort(key=lambda x: x["sm_pct"], reverse=True)

    # ── Satire stats
    satire_sm = sm[sm['is_satire']]
    satire_pct = round(satire_sm['engagement_score'].sum() / total_eng * 100, 1) if total_eng > 0 else 0

    # ── Daily trend
    sm_daily = (sm.groupby('date')
                  .agg(posts=('pid','count'), engagement=('engagement_score','sum'))
                  .reset_index()
                  .sort_values('date'))
    cm_daily = (cm.groupby('date')
                  .agg(articles=('Document ID','count'), ave=('AVE','sum'))
                  .reset_index()
                  .sort_values('date'))

    # Peak days
    peak_sm_idx  = sm_daily['engagement'].idxmax() if len(sm_daily) else None
    peak_sm_day  = str(sm_daily.loc[peak_sm_idx, 'date']) if peak_sm_idx is not None else None
    peak_cm_idx  = cm_daily['ave'].idxmax() if len(cm_daily) else None
    peak_cm_day  = str(cm_daily.loc[peak_cm_idx, 'date']) if peak_cm_idx is not None else None

    # Daily cluster breakdown (for area chart)
    daily_cluster_rows = []
    for d in sorted(sm['date'].dropna().unique()):
        day = sm[sm['date'] == d]
        day_total = day['engagement_score'].sum()
        row = {"date": str(d), "total": round(day_total, 0)}
        for cl in CLUSTER_DEFS:
            sub_eng = day[day['cluster'] == cl["id"]]['engagement_score'].sum()
            row[cl["id"]] = round(sub_eng / day_total * 100, 1) if day_total > 0 else 0
        row["Other"] = round(100 - sum(row.get(cl["id"], 0) for cl in CLUSTER_DEFS), 1)
        daily_cluster_rows.append(row)

    # ── Regional stats
    region_stats = []
    for r in REGION_DEFS:
        rname = r["name"]
        sm_r  = sm[sm['region'] == rname]
        cm_r  = cm[cm['region'] == rname]
        eng   = sm_r['engagement_score'].sum()
        ave   = cm_r['AVE'].sum()
        esc   = sm_r['escalation'].sum()
        if len(sm_r) == 0 and len(cm_r) == 0:
            continue
        # Dominant cluster in region
        if len(sm_r):
            dom = sm_r.groupby('cluster')['engagement_score'].sum().idxmax()
        else:
            dom = "Other"
        region_stats.append({
            "name":       rname,
            "sm_posts":   int(len(sm_r)),
            "cm_articles":int(len(cm_r)),
            "engagement": round(eng, 0),
            "ave":        round(ave, 0),
            "escalation": int(esc),
            "dominant_cluster": dom,
            "status": ("hot" if esc >= 5 else "watch" if esc >= 2 or eng > 10000 else "monitor"),
        })
    region_stats.sort(key=lambda x: x["engagement"], reverse=True)

    return {
        "meta": {
            "period_start":  period_start,
            "last_updated":  last_updated,
            "sm_total_posts": int(len(sm)),
            "cm_total_articles": int(len(cm)),
            "total_engagement": round(total_eng, 0),
            "generated_at":  datetime.utcnow().isoformat() + "Z",
        },
        "clusters":          cluster_stats,
        "satire_note": {
            "sm_pct":  satire_pct,
            "posts":   int(len(satire_sm)),
            "peak_dates": ["2026-04-21","2026-04-22","2026-04-23"],
        },
        "daily_sm": [
            {"date": str(r["date"]), "posts": int(r["posts"]), "engagement": round(r["engagement"], 0)}
            for _, r in sm_daily.iterrows()
        ],
        "daily_cm": [
            {"date": str(r["date"]), "articles": int(r["articles"]), "ave": round(r["ave"], 0)}
            for _, r in cm_daily.iterrows()
        ],
        "daily_clusters": daily_cluster_rows,
        "regions":           region_stats,
        "emerging_narratives": emerging_summary,
    }
