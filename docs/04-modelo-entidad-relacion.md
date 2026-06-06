# 04. Modelo Entidad Relacion

Entidades principales implementadas en Prisma:
- User
- StudySession
- Goal
- KnowledgeNote
- LearningCourse
- LearningModule
- LessonProgress
- LabEntry
- Writeup
- Certification
- Project
- ToolkitReport
- SiemEvent
- SiemRule
- InventoryAsset
- AuditLog

Relaciones clave:
- User 1..N Goal, StudySession, LabEntry, Course, Project, Note, Writeup.
- LearningCourse 1..N LearningModule.
- LearningModule 1..N LessonProgress.
- User 1..N InventoryAsset.

Para exportar modelo DBML:
- npm run dbml
