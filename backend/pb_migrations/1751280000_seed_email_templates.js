migrate((app) => {
    const collection = app.findCollectionByNameOrId("email_templates");
    
    // Email templates for order confirmation (Arabic and English)
    const templates = [
        {
            name: "order_confirmation_ar",
            subject: "تأكيد طلبك - أرض الأغنام",
            body: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">تأكيد الطلب #{{order_id}}</h2>
                <p>عزيزي {{customer_name}}،</p>
                <p>شكراً لطلبك من أرض الأغنام. تم استلام طلبك وسيتم معالجته قريباً.</p>
                
                <h3>تفاصيل الطلب:</h3>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <p><strong>رقم الطلب:</strong> {{order_id}}</p>
                    <p><strong>التاريخ:</strong> {{order_date}}</p>
                    <p><strong>المجموع:</strong> {{total_amount}} جنيه مصري</p>
                    <p><strong>طريقة الدفع:</strong> {{payment_method}}</p>
                    <p><strong>حالة الطلب:</strong> {{order_status}}</p>
                </div>
                
                <h3>المنتجات:</h3>
                {{order_items}}
                
                <h3>معلومات التوصيل:</h3>
                <p><strong>العنوان:</strong> {{delivery_address}}</p>
                <p><strong>الهاتف:</strong> {{phone}}</p>
                
                <p>للتواصل معنا عبر واتساب: <a href="{{whatsapp_link}}">اضغط هنا</a></p>
                
                <p>مع تحيات،<br>فريق أرض الأغنام</p>
            </div>`,
            active: true
        },
        {
            name: "order_confirmation_en",
            subject: "Order Confirmation - Sheep Land",
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Order Confirmation #{{order_id}}</h2>
                <p>Dear {{customer_name}},</p>
                <p>Thank you for your order from Sheep Land. We have received your order and it will be processed soon.</p>
                
                <h3>Order Details:</h3>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <p><strong>Order ID:</strong> {{order_id}}</p>
                    <p><strong>Date:</strong> {{order_date}}</p>
                    <p><strong>Total:</strong> {{total_amount}} EGP</p>
                    <p><strong>Payment Method:</strong> {{payment_method}}</p>
                    <p><strong>Order Status:</strong> {{order_status}}</p>
                </div>
                
                <h3>Products:</h3>
                {{order_items}}
                
                <h3>Delivery Information:</h3>
                <p><strong>Address:</strong> {{delivery_address}}</p>
                <p><strong>Phone:</strong> {{phone}}</p>
                
                <p>Contact us on WhatsApp: <a href="{{whatsapp_link}}">Click here</a></p>
                
                <p>Best regards,<br>Sheep Land Team</p>
            </div>`,
            active: true
        },
        {
            name: "order_status_update_ar",
            subject: "تحديث حالة الطلب - أرض الأغنام",
            body: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">تحديث حالة الطلب</h2>
                <p>عزيزي {{customer_name}}،</p>
                <p>تم تحديث حالة طلبك #{{order_id}}</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <p><strong>الحالة الجديدة:</strong> {{new_status}}</p>
                    <p><strong>التاريخ:</strong> {{update_date}}</p>
                    {{#if tracking_number}}
                    <p><strong>رقم التتبع:</strong> {{tracking_number}}</p>
                    {{/if}}
                    {{#if estimated_delivery}}
                    <p><strong>التسليم المتوقع:</strong> {{estimated_delivery}}</p>
                    {{/if}}
                </div>
                
                <p>لمتابعة طلبك، يمكنك زيارة حسابك على موقعنا.</p>
                
                <p>مع تحيات،<br>فريق أرض الأغنام</p>
            </div>`,
            active: true
        },
        {
            name: "welcome_email_ar",
            subject: "مرحباً بك في أرض الأغنام",
            body: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">مرحباً بك في أرض الأغنام!</h2>
                <p>عزيزي {{customer_name}}،</p>
                <p>نرحب بك في عائلة أرض الأغنام. نحن سعداء بانضمامك إلينا.</p>
                
                <h3>ماذا نقدم:</h3>
                <ul>
                    <li>أجود أنواع الأغنام الحية</li>
                    <li>خدمات الأضحية مع الالتزام الديني الكامل</li>
                    <li>لحوم طازجة ومنتجات عالية الجودة</li>
                    <li>باقات للمناسبات والتجمعات</li>
                </ul>
                
                <p>كعضو جديد، استمتع بخصم 10% على طلبك الأول باستخدام الكود: <strong>WELCOME10</strong></p>
                
                <p>للتواصل معنا:<br>
                WhatsApp: <a href="https://wa.me/201234567890">01234567890</a><br>
                Email: info@sheep.land</p>
                
                <p>مع أطيب التمنيات،<br>فريق أرض الأغنام</p>
            </div>`,
            active: true
        },
        {
            name: "password_reset_ar",
            subject: "إعادة تعيين كلمة المرور - أرض الأغنام",
            body: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">إعادة تعيين كلمة المرور</h2>
                <p>عزيزي {{customer_name}}،</p>
                <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p>
                
                <p>لإعادة تعيين كلمة المرور، اضغط على الرابط التالي:</p>
                <p style="text-align: center;">
                    <a href="{{reset_link}}" style="background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">إعادة تعيين كلمة المرور</a>
                </p>
                
                <p>هذا الرابط صالح لمدة 24 ساعة فقط.</p>
                
                <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
                
                <p>مع تحيات،<br>فريق أرض الأغنام</p>
            </div>`,
            active: true
        }
    ];
    
    // Create template records
    templates.forEach(template => {
        const record = new Record(collection);
        record.set("name", template.name);
        record.set("subject", template.subject);
        record.set("body", template.body);
        record.set("active", template.active);
        
        try {
            app.dao().saveRecord(record);
        } catch (e) {
            console.log("Template already exists:", template.name);
        }
    });
    
    console.log("Email templates seeded successfully");
}, (app) => {
    // Rollback - remove seeded templates
    const templates = [
        "order_confirmation_ar",
        "order_confirmation_en",
        "order_status_update_ar",
        "welcome_email_ar",
        "password_reset_ar"
    ];
    
    templates.forEach(name => {
        try {
            const record = app.dao().findFirstRecordByData("email_templates", "name", name);
            if (record) {
                app.dao().deleteRecord(record);
            }
        } catch (e) {
            // Record doesn't exist
        }
    });
});