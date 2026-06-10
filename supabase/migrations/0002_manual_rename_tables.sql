ALTER TABLE kidzee_mundhwa RENAME TO kidzee_mundhwa_invoices;
ALTER TABLE contact_group RENAME TO kidzee_mundhwa_contact_group;
ALTER TABLE contact RENAME TO kidzee_mundhwa_contact;
ALTER TABLE announcement_log RENAME TO kidzee_mundhwa_announcement_log;

ALTER INDEX kidzee_mundhwa_status_idx RENAME TO kidzee_mundhwa_invoices_status_idx;
ALTER INDEX kidzee_mundhwa_student_id_idx RENAME TO kidzee_mundhwa_invoices_student_id_idx;
ALTER INDEX contact_group_created_by_idx RENAME TO kidzee_mundhwa_cg_created_by_idx;
ALTER INDEX contact_group_id_idx RENAME TO kidzee_mundhwa_contact_group_id_idx;
ALTER INDEX announcement_log_user_id_idx RENAME TO kidzee_mundhwa_al_user_id_idx;
ALTER INDEX announcement_log_created_at_idx RENAME TO kidzee_mundhwa_al_created_at_idx;

-- FK constraint names reference old table names; Postgres updates them automatically on rename.
