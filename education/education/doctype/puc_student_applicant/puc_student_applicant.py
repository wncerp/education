# Copyright (c) 2025
# Custom DocType controller for PUC Student Applicant

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_years, date_diff, getdate, nowdate


class PUCStudentApplicant(Document):
    def autoname(self):
        from frappe.model.naming import set_name_by_naming_series
        # Always use naming series for autoname
        set_name_by_naming_series(self)

    def validate(self):
        self.set_title()
        self.validate_dates()
        self.validate_term()
        self.validate_required_fields()
        self.validate_mobile_aadhar()
        self.validate_income_certificate()

    def set_title(self):
        # Use SSLC name if available, else fallback
        if self.student_name_as_per_sslc:
            self.title = self.student_name_as_per_sslc
  #      else:
            self.title = "PUC Student"
           # .join(
#                filter(None, [self.first_name, self.middle_name, self.last_name])
#            )

    def validate_dates(self):
        if self.date_of_birth and getdate(self.date_of_birth) >= getdate():
            frappe.throw(_("Date of Birth cannot be greater than today."))

    def validate_term(self):
        if self.academic_year and self.academic_term:
            actual_academic_year = frappe.db.get_value(
                "Academic Term", self.academic_term, "academic_year"
            )
            if actual_academic_year != self.academic_year:
                frappe.throw(
                    _("Academic Term {0} does not belong to Academic Year {1}").format(
                        self.academic_term, self.academic_year
                    )
                )

    def validate_required_fields(self):
        required_fields = {
            "sats_no": "SATS Number",
            "reservation_category": "Reservation Category",
            "student_mobile_number": "Mobile Number",
            "aadhar_no": "Aadhar Number",
        }
        for field, label in required_fields.items():
            if not getattr(self, field, None):
                frappe.throw(_("{0} is mandatory.").format(label))

    def validate_mobile_aadhar(self):
        if self.student_mobile_number and len(self.student_mobile_number) != 10:
            frappe.throw(_("Mobile Number must be 10 digits"))

        if self.aadhar_no and len(self.aadhar_no) not in (12, 16):
            frappe.throw(_("Aadhar Number must be 12 or 16 digits"))

    def validate_income_certificate(self):
        if self.income_certificate_enclosed == "Yes" and not self.parent_annual_income:
            frappe.throw(_("Annual Income must be specified if Income Certificate is enclosed."))

    def on_payment_authorized(self, *args, **kwargs):
        self.db_set("paid", 1)

