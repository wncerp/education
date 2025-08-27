// Copyright (c) 2025
// Custom script for PUC Student Applicant
// Extends default ERPNext workflow with PUC admission fields

frappe.ui.form.on('PUC Student Applicant', {
  refresh: function (frm) {
    // filter academic term by academic year
    frm.set_query('academic_term', function () {
      return {
        filters: {
          academic_year: frm.doc.academic_year,
        },
      };
    });

    // --- Workflow Actions ---
    if (!frm.is_new() && frm.doc.application_status === 'Applied') {
      frm.add_custom_button(__('Approve'), function () {
        frm.set_value('application_status', 'Approved');
        frm.save_or_update();
      }, 'Actions');

      frm.add_custom_button(__('Reject'), function () {
        frm.set_value('application_status', 'Rejected');
        frm.save_or_update();
      }, 'Actions');
    }

    if (!frm.is_new() && frm.doc.application_status === 'Approved') {
      frm.add_custom_button(__('Enroll'), function () {
        frm.events.enroll(frm);
      });

      frm.add_custom_button(__('Reject'), function () {
        frm.set_value('application_status', 'Rejected');
        frm.save_or_update();
      }, 'Actions');
    }

    if (!frm.is_new() && frm.doc.application_status === 'Rejected') {
      frm.add_custom_button(__('Approve'), function () {
        frm.set_value('application_status', 'Approved');
        frm.save_or_update();
      }, 'Actions');
    }

    // --- Progress feedback while enrolling ---
    frappe.realtime.on('enroll_student_progress', function (data) {
      if (data.progress) {
        frappe.hide_msgprint(true);
        frappe.show_progress(
          __('Enrolling student'),
          data.progress[0],
          data.progress[1]
        );
      }
    });

    // --- Enforce required fields ---
    // Student Email required unless skipped in Education Settings
    frappe.db.get_value('Education Settings', { name: 'Education Settings' }, 'user_creation_skip', (r) => {
      if (cint(r.user_creation_skip) !== 1) {
        frm.set_df_property('student_email_id', 'reqd', 1);
      }
    });

    // Income Certificate check (if "Yes", then require upload/attachment)
    if (frm.doc.income_certificate_enclosed === 'Yes') {
      frm.set_df_property('income_certificate_enclosed', 'reqd', 1);
    }
  },

  // --- Enroll Action ---
  enroll: function (frm) {
    frappe.model.open_mapped_doc({
      method: 'education.education.api.enroll_student',
      frm: frm,
    });
  },
});

