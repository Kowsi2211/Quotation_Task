// Copyright (c) 2025, kowsalya and contributors
// For license information, please see license.txt

frappe.ui.form.on("Job Quotation", {
	//for updating read only property for customer details
	refresh(frm) {
		console.log(frm.doc.admit);

		if (frm.doc.customer_name) {
			frappe.call({
				method: "quotation_kowsalya.quotation_kowsalya.doctype.job_quotation.job_quotation.get_values",
				args: {
					cust_name: frm.doc.customer_name,
				},
				callback: function (r) {
					let [address, contact, email] = r.message;

					if (address) {
						frm.set_df_property("address", "read_only", 1);
					} else {
						frm.set_df_property("address", "read_only", 0);
					}
					if (contact) {
						frm.set_df_property("customer_contact_number", "read_only", 1);
					} else {
						frm.set_df_property("customer_contact_number", "read_only", 0);
					}
					if (email) {
						frm.set_df_property("customer_email", "read_only", 1);
					} else {
						frm.set_df_property("customer_email", "read_only", 0);
					}
				},
			});
		} else {
			frm.set_value("address", " ");
			frm.set_value("customer_contact_number", " ");
		}

		// filter for quotation
		frm.set_query("quotation", () => {
			return {
				filters: {
					customer_name: frm.doc.customer_name,
				},
			};
		});

		//change status
		if (frm.doc.workflow_state == "Submitted") {
			frm.add_custom_button("Change status", () => {
				let d = new frappe.ui.Dialog({
					title: "Status Update",
					fields: [
						{
							label: __("Status"),
							fieldname: "status",
							fieldtype: "Select",
							options: ["Completed", "Cancelled"],
						},
					],
					primary_action_label: "Update",
					primary_action(values) {
						frm.set_value("status", values.status);
						frm.refresh_fields("status");
						frm.save();
						d.hide();
					},
				});
				d.show();
			});
		}
	},
	validate(frm) {
		if (!frm.is_dirty() && frm.doc.workflow_state == "Draft") {
			if (doc.total_quantity == 0) {
				frappe.throw("Unable to submit there was no quantity in item");
			}
		}
	},
	// onsubmit function

	before_workflow_action: function (frm) {
		// total quantity validation
		// if (doc.total_quantity == 0) {
		// 	frappe.validated = false;
		// 	frm.set_value("workflow_state", "Draft");
		// 	frm.save();
		// 	frappe.throw(__("Unable to submit: Total quantity cannot be zero or empty"));
		// 	return false;
		// }

		// dialog api
		var action = frm.selected_workflow_action;
		if (action && action.toLowerCase() === "submit") {
			frappe.validated = false;
			let d = new frappe.ui.Dialog({
				title: "Enter details",
				fields: [
					{
						label: __("Project Title"),
						fieldname: "project_title",
						fieldtype: "Data",
						default: frm.doc.project_title,
					},
					{
						label: __("Project Type"),
						fieldname: "project_type",
						fieldtype: "Select",
						options: ["Interior", "Exterior", "Landscaping", "Electrical"],
					},
					{
						label: __("Total Quantity"),
						fieldname: "total_quantity",
						fieldtype: "Data",
						default: frm.doc.total_quantity,
					},
					{
						label: __("Total Amount"),
						fieldname: "total_amount",
						fieldtype: "Data",
						default: frm.doc.total_amount,
					},
				],
				primary_action_label: "Confirm ",
				primary_action(values) {
					frm.set_value("project_title", values.project_title);
					frm.set_value("project_type", values.project_type);
					frm.set_value("total_quantity", values.total_quantity);
					frm.set_value("total_amount", values.total_amount);
					if (frm.doc.total_amount == 0) {
						frappe.show_alert(" there was no quantity in item");
						frm.set_value("workflow_state", "Draft");
						frm.save();
					}
					
					d.hide();

					frm.save().then(function () {
						frappe.validated = true;
						frm.workflow_action(action);
					});
				},
				secondary_action_label: "Edit ",
				secondary_action() {
					frm.set_value("workflow_state", "Draft");
					frm.save();

					d.hide();
				},
			});
			d.show();
			return false;
		}
	},

	//for fetching value from customer doctype
	customer_name(frm) {
		if (frm.doc.customer_name) {
			frappe.call({
				method: "quotation_kowsalya.quotation_kowsalya.doctype.job_quotation.job_quotation.get_values",
				args: {
					cust_name: frm.doc.customer_name,
				},
				callback: function (r) {
					let [address, contact, email] = r.message;
					if (address) {
						frm.set_value("address", address);
						frm.set_df_property("address", "read_only", 1);
					} else {
						frm.set_value("address", " ");
						frm.set_df_property("address", "read_only", 0);
					}
					if (contact) {
						frm.set_value("customer_contact_number", contact);
						frm.set_df_property("customer_contact_number", "read_only", 1);
					} else {
						frm.set_value("customer_contact_number", " ");
						frm.set_df_property("customer_contact_number", "read_only", 0);
					}
					if (email) {
						frm.set_value("customer_email", email);
						frm.set_df_property("customer_email", "read_only", 1);
					} else {
						frm.set_value("customer_email", " ");
						frm.set_df_property("customer_email", "read_only", 0);
					}
				},
			});
		} else {
			frm.set_value("address", " ");
			frm.set_value("customer_contact_number", " ");
			frm.set_value("customer_email", " ");
			frm.set_value("items_table", []);
			frm.refresh_fields("items_table");
			frm.set_value("total_quantity", 0);
			frm.set_value("total_amount", 0);
			frm.set_value("quotation", "");
			frm.refresh_fields("quotation");
		}
	},
	start_date(frm) {
		duration(frm);
	},
	end_date(frm) {
		duration(frm);
	},
	// fetching values in item table
	quotation(frm) {
		if (frm.doc.quotation && frm.doc.customer_name) {
			frappe.call({
				method: "quotation_kowsalya.quotation_kowsalya.doctype.job_quotation.job_quotation.fetch_item_value",
				args: {
					cust_name: frm.doc.customer_name,
				},
				callback: function (r) {
					let value = r.message.items;
					let total_qty = 0;
					let total_amt = 0;
					value.forEach((row) => {
						let item_child = frm.add_child("items_table");
						item_child.item_code = row.item_code;
						item_child.unit = row.uom;
						item_child.quantity = row.qty;
						item_child.rate = row.rate;
						item_child.amount = row.rate * row.qty;
						total_qty += row.qty;
						total_amt += row.rate * row.qty;
						frm.refresh_fields("items_table");
						frm.set_value("total_quantity");
					});
					frm.set_value("total_quantity", total_qty);
					frm.set_value("total_amount", total_amt);
				},
			});
		} else {
			frm.set_value("items_table", []);
			frm.refresh_fields("items_table");
			frm.set_value("total_quantity", 0);
			frm.set_value("total_amount", 0);
			frm.set_value("quotation", "");
			frm.refresh_fields("quotation");
			if (!frm.__alert_shown) {
				frappe.show_alert("Enter the customer details");
				frm.__alert_shown = true;
			}
		}
	},
});

frappe.ui.form.on("Quotation Items", {
	// validation for child table add
	items_table_add: function (frm, cdn, cdt) {
		if (frm.doc.customer_name && frm.doc.quotation) {
			frappe.call({
				method: "quotation_kowsalya.quotation_kowsalya.doctype.job_quotation.job_quotation.check_item_value",
				args: {
					cust_name: frm.doc.customer_name,
				},
				callback: function (r) {
					if (r) {
						let item_codes = r.message.items.map((row) => row.item_code);
						console.log(item_codes);
						frm.set_query("item_code", "items_table", () => {
							return {
								filters: {
									item_name: ["in", item_codes],
								},
							};
						});
					} 
				},
			});
		} else {
			frm.set_value("items_table", []);
			frm.refresh_fields("items_table");
			frm.set_df_property("quotation", "reqd", 1);
			frappe.throw("Enter the customer and quotation details");
		}
	},
	
});

//for date differnce
function duration(frm) {
	if (frm.doc.start_date && frm.doc.end_date) {
		frappe.call({
			method: "quotation_kowsalya.quotation_kowsalya.doctype.job_quotation.job_quotation.day_difference",
			args: {
				start_date: frm.doc.start_date,
				end_date: frm.doc.end_date,
			},
			callback: function (r) {
				console.log(r.message);
				frm.set_value("duration", r.message);
			},
		});
	}
}
