# Teh Ais - Firestore Database Schema

This document serves as the single source of truth for the Teh Ais Firebase Firestore database structure. All frontend and backend operations MUST strictly adhere to these field names and data types.

---

## 1. Users (Collection: `Users`)
Stores all student profiles and their verified academic/skill tags.

| Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| `uid` | String | Document ID (e.g., "O7819DECn...") |
| `name` | String | Full name of the student |
| `role` | String | "Student" |
| `major_id` | Number | Tag ID for their major |
| `courses_id` | Array of Numbers | Tag IDs for courses taken |
| `skill_tags` | Array of Maps | e.g., `[{ tag_id: 301, is_confirmed: true }]` |
| `dev_tags` | Array of Numbers | Tag IDs for development/research areas |
| `matric_no` | String | e.g., "23001234" |
| `email` | String | e.g., "23001234@siswa.um.edu.my" |
| `whatsapp_num` | String | e.g., "+60123456789" |
| `portfolio_url` | String | Google Drive or GitHub link |

---

## 2. Tags (Collection: `Tags`)
The global dictionary for all UM majors, courses, skills, and dev areas.

| Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| `Document ID` | String | ID of the tag (e.g., "101", "205") |
| `name` | String | e.g., "Computer Science", "Python" |
| `category_id` | Number | 0=Major, 1=Course, 2=Skill, 3=Dev Area |

---

## 3. Posts (Collection: `Posts`)
Recruitment posts created by students.

| Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| `post_id` | String | Document ID |
| `creator_id` | String | UID of the user who posted |
| `type` | String | "Coursework", "Startup", "Competition", etc. |
| `title` | String | Post title |
| `description` | String | Full post content |
| `status` | String | "Open" or "Closed" |
| `created_at` | Timestamp | Time of posting |
| `requirements` | Array of Numbers | Tag IDs required for the post |

---

## 4. Matches (Collection: `Matches`)
Connection records between Users and Posts (Red Strings).

| Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| `match_id` | String | Document ID |
| `post_id` | String | ID of the associated post |
| `candidate_id` | String | UID of the applicant/recommended user |
| `match_type` | String | "AI_Recommendation" or "Organic_Application" |
| `score` | Float / Null | AI score (e.g., 0.95). `null` if organic |
| `match_status`| String | "Recommended", "Pending", "Accepted", "Rejected" |
| `reason` | String | Dynamic AI reason or user's application message |
| `created_at` | Timestamp | Time of match/application |

---

## 5. Events (Collection: `Events`)
University-wide events, workshops, and seminars.

| Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| `event_id` | String | Document ID |
| `title` | String | Event title |
| `organizer` | String | e.g., "UMEC", "Computer Science Society" |
| `type` | String | "Competition", "Workshop", "Talk", "Other" |
| `is_official` | Boolean | Is this an official UM event? |
| `is_all_majors` | Boolean | Open to all faculties? |
| `target_majors` | Array of Strings | Restrict to specific faculties (e.g., `["FSKTM"]`) |
| `location` | String | Venue or online link |
| `description` | String | Full event description |
| `event_date` | Timestamp | Future date of the event |
| `created_at` | Timestamp | When the event was published |
| `related_tags` | Array of Numbers | Tag IDs associated with this event |
| `action_links` | Map | `{ register_url: "...", whatsapp_url: "..." }` |

---

## 6. EventMatches (Collection: `EventMatches`)
Connection records between Users and Events.

| Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| `event_match_id`| String | Document ID |
| `event_id` | String | ID of the associated event |
| `user_id` | String | UID of the participant |
| `match_type` | String | "User_Prompt_Search", "Organizer_AI_Invite", "Organic_Browse" |
| `score` | Float / Null | AI matching score (null if organic) |
| `status` | String | "Recommended", "Joined", "Ignored" |
| `ai_reason` | String | Dynamic AI copy or organic copy |
| `created_at` | Timestamp | Time of the interaction |

---

## 7. TempChats (Collection: `TempChats`)
Temporary 1-on-1 chat rooms generated after an "Accepted" Match.

| Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| `chat_id` | String | Document ID |
| `members` | Array of Strings | Contains exactly 2 UIDs: `[creator_id, candidate_id]` |
| `source_type` | String | Currently "Post" |
| `source_id` | String | The post_id |
| `match_id` | String | The match_id linking this chat |
| `chat_title` | String | e.g., "Project: Figma Zero to Hero" |
| `last_message` | String | The text of the latest message for UI list rendering |
| `last_updated_at`| Timestamp | Time of the last message |
| `is_notified` | Boolean | Has the push notification been sent? |
| `status` | String | "Active", "Expired", "Converted" |
| `created_at` | Timestamp | Time of room creation |
| `expire_at` | Timestamp | Auto-destroy time (usually +48 hours) |

### 7.1 Messages (Sub-collection: `TempChats/{chat_id}/Messages`)
Individual chat messages inside the chat room.

| Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| `message_id` | String | Document ID |
| `sender_id` | String | UID of the sender |
| `text` | String | Content of the message |
| `timestamp` | Timestamp | Send time |
| `is_read` | Boolean | True/False |
