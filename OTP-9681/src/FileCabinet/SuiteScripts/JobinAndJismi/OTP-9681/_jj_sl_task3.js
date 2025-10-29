/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/log'], function(serverWidget, record, log) {

  function buildForm() {
    const form = serverWidget.createForm({ title: 'Customer Inquiry Form' });

    form.addField({
      id: 'custpage_name',
      type: serverWidget.FieldType.TEXT,
      label: 'Customer Name'
    }).isMandatory = true;

    form.addField({
      id: 'custpage_email',
      type: serverWidget.FieldType.EMAIL,
      label: 'Customer Email'
    }).isMandatory = true;

    form.addField({
      id: 'custpage_subject',
      type: serverWidget.FieldType.TEXT,
      label: 'Subject'
    }).isMandatory = true;

    form.addField({
      id: 'custpage_message',
      type: serverWidget.FieldType.TEXTAREA,
      label: 'Message'
    }).isMandatory = true;

    form.addSubmitButton({ label: 'Submit Inquiry' });
    return form;
  }

  function createInquiryRecord(params) {
    try {
      const inquiry = record.create({
        type: 'customrecord_jj_customer_inquiry',
        isDynamic: true
      });

      inquiry.setValue({ fieldId: 'custrecord_jj_customer_name', value: params.name });
      inquiry.setValue({ fieldId: 'custrecord_jj_customer_email', value: params.email });
      inquiry.setValue({ fieldId: 'custrecord_jj_subject', value: params.subject });
      inquiry.setValue({ fieldId: 'custrecord_jj_message', value: params.message });

      inquiry.save();
    } catch (error) {
      log.error({ title: 'Create Inquiry Error', details: error });
    }
  }

  function onRequest(context) {
    if (context.request.method === 'GET') {
      context.response.writePage(buildForm());
    } else {
      try {
        const params = {
          name: context.request.parameters.custpage_name,
          email: context.request.parameters.custpage_email,
          subject: context.request.parameters.custpage_subject,
          message: context.request.parameters.custpage_message
        };

        createInquiryRecord(params);
        context.response.write('Thank you! Your inquiry has been submitted.');
      } catch (error) {
        log.error({ title: 'Form Submission Error', details: error });
        context.response.write('An error occurred. Please try again later.');
      }
    }
  }

  return {
    onRequest: onRequest
  };
});
