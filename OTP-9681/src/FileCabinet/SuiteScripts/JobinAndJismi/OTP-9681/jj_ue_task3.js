/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/email', 'N/runtime', 'N/log'], function(record, search, email, runtime, log) {
  const ADMIN_ID = -5; // Replace with actual Admin internal ID if needed

  function findCustomerByEmail(emailValue) {
    try {
      const customerSearch = search.create({
        type: search.Type.CUSTOMER,
        filters: [['email', 'is', emailValue]],
        columns: ['internalid', 'salesrep']
      });

      const result = customerSearch.run().getRange({ start: 0, end: 1 });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      log.error({ title: 'Customer Search Error', details: error });
      return null;
    }
  }

  function linkCustomerToInquiry(inquiryId, customerId) {
    try {
      const inquiryRecord = record.load({
        type: 'customrecord_jj_customer_inquiry',
        id: inquiryId,
        isDynamic: true
      });

      inquiryRecord.setValue({
        fieldId: 'custrecord_jj_linked_customer',
        value: customerId
      });

      inquiryRecord.save();
    } catch (error) {
      log.error({ title: 'Linking Error', details: error });
    }
  }

  function notifyAdmin(name, emailValue, subject, message) {
    try {
      const emailBody = `
A new customer inquiry has been submitted:

Customer Name: ${name}
Customer Email: ${emailValue}
Subject: ${subject}
Message:
${message}

Please review the inquiry in NetSuite.
      `;

      email.send({
        author: runtime.getCurrentUser().id,
        recipients: ADMIN_ID,
        subject: 'New Customer Inquiry Submitted',
        body: emailBody
      });
    } catch (error) {
      log.error({ title: 'Admin Notification Error', details: error });
    }
  }

  function notifySalesRep(salesRepId, name, emailValue, subject, message) {
    try {
      const emailBody = `
You have received a new inquiry from your customer:

Customer Name: ${name}
Customer Email: ${emailValue}
Subject: ${subject}
Message:
${message}

Please follow up as needed.
      `;

      email.send({
        author: runtime.getCurrentUser().id,
        recipients: salesRepId,
        subject: 'Customer Inquiry Notification',
        body: emailBody
      });
    } catch (error) {
      log.error({ title: 'Sales Rep Notification Error', details: error });
    }
  }

  function afterSubmit(context) {
    if (context.type !== context.UserEventType.CREATE) return;

    try {
      const newRecord = context.newRecord;
      const emailValue = newRecord.getValue('custrecord_jj_customer_email');
      const nameValue = newRecord.getValue('custrecord_jj_customer_name');
      const subjectValue = newRecord.getValue('custrecord_jj_subject');
      const messageValue = newRecord.getValue('custrecord_jj_message');

      if (!emailValue) return;

      notifyAdmin(nameValue, emailValue, subjectValue, messageValue);

      const customer = findCustomerByEmail(emailValue);
      if (customer) {
        const customerId = customer.getValue('internalid');
        const salesRepId = customer.getValue('salesrep');

        linkCustomerToInquiry(newRecord.id, customerId);

        if (salesRepId) {
          notifySalesRep(salesRepId, nameValue, emailValue, subjectValue, messageValue);
        }
      }
    } catch (error) {
      log.error({ title: 'afterSubmit Error', details: error });
    }
  }

  return {
    afterSubmit: afterSubmit
  };
});
