/**
 * Tag cache utility — loads all Tags from Firestore once and caches them.
 * Tags use integer document IDs (e.g. "306") and have { name, category_id }.
 */

let tagMap = null; // { "306": "Python", "318": "C++" }

async function getTagMap(db) {
  if (tagMap) return tagMap;
  const snap = await db.collection('Tags').get();
  tagMap = {};
  snap.docs.forEach((d) => {
    tagMap[d.id] = d.data().name || d.id;
  });
  return tagMap;
}

/** Resolve an array of integer tag IDs to an array of name strings */
async function resolveTagIds(db, ids = []) {
  if (!ids || ids.length === 0) return [];
  const map = await getTagMap(db);
  return ids.map((id) => map[String(id)] || `Tag #${id}`);
}

/** Resolve skill_tags array [{tag_id, is_confirmed}] to name strings */
async function resolveSkillTags(db, skillTags = []) {
  if (!skillTags || skillTags.length === 0) return [];
  const map = await getTagMap(db);
  return skillTags.map((st) => ({
    name: map[String(st.tag_id)] || `Tag #${st.tag_id}`,
    is_confirmed: st.is_confirmed,
  }));
}

/** Format a Firestore timestamp object { _seconds } to a readable date string */
function formatTimestamp(ts) {
  if (!ts) return 'TBD';
  const secs = ts._seconds || ts.seconds;
  if (!secs) return 'TBD';
  return new Date(secs * 1000).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Returns a score color class based on match score */
function scoreClass(score) {
  if (!score) return 'score-low';
  if (score >= 0.8) return 'score-high';
  if (score >= 0.6) return 'score-mid';
  return 'score-low';
}

/** Returns a chip class based on match status */
function statusChip(status) {
  const map = {
    Accepted: 'chip-green',
    Recommended: 'chip-purple',
    Pending: 'chip-amber',
    Rejected: 'chip-red',
  };
  return map[status] || 'chip';
}

module.exports = { getTagMap, resolveTagIds, resolveSkillTags, formatTimestamp, scoreClass, statusChip };
