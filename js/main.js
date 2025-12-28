document.addEventListener('DOMContentLoaded', () => {
    
    // --- חיפוש (Search Logic) ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim().toLowerCase();
            const allCards = document.querySelectorAll('.physio-card'); 

            allCards.forEach(card => {
                const title = card.querySelector('.card-title').innerText.toLowerCase();
                if (title.includes(searchTerm)) {
                    card.style.display = ""; 
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

    // --- תפריט המבורגר (ניווט) ---
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');
    
    if(hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // --- תפריט בחירה מותאם אישית (נושא הפנייה - פוטר) ---
    const subjectTrigger = document.getElementById('subjectTrigger');
    const subjectOptions = document.getElementById('subjectOptions');
    const hiddenInput = document.getElementById('userSubject'); // השדה הנסתר שנשלח ל-SCORM
    const selectedText = document.getElementById('selectedText');
    const options = document.querySelectorAll('.custom-option');

    if (subjectTrigger && subjectOptions) {
        
        // 1. פתיחה/סגירה בלחיצה
        subjectTrigger.addEventListener('click', (e) => {
            e.preventDefault(); // מונע ריענון או התנהגות כפתור רגילה
            subjectOptions.classList.toggle('open');
            subjectTrigger.classList.toggle('active');
        });

        // 2. בחירת אפשרות מהרשימה
        options.forEach(option => {
            option.addEventListener('click', () => {
                // עדכון הטקסט בכפתור שרואים
                selectedText.innerText = option.innerText;
                
                // עדכון הערך בשדה הנסתר (חשוב בשביל ה-SCORM)
                hiddenInput.value = option.getAttribute('data-value');
                
                // שינוי צבע טקסט ללבן (במקום האפור ההתחלתי)
                subjectTrigger.style.color = "white"; 
                subjectTrigger.style.borderColor = "white";

                // סגירת התפריט
                subjectOptions.classList.remove('open');
                subjectTrigger.classList.remove('active');
            });
        });

        // 3. סגירה כשלוחצים מחוץ לתפריט (כדי שלא יישאר פתוח סתם)
        document.addEventListener('click', (e) => {
            if (!subjectTrigger.contains(e.target) && !subjectOptions.contains(e.target)) {
                subjectOptions.classList.remove('open');
                subjectTrigger.classList.remove('active');
            }
        });
    }

    // --- כפתור שליחה ל-SCORM ---
    const submitBtn = document.getElementById('submitBtn');
    if(submitBtn) {
        submitBtn.addEventListener('click', processScormForm);
    }
});

// --- פונקציות ה-SCORM ---

function processScormForm() {
    // שליפת נתונים
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;
    // עכשיו שולפים את הערך מהשדה הנסתר שעדכנו קודם
    const subject = document.getElementById('userSubject').value;

    // ולידציה בסיסית
    if (!name || !phone || !subject) {
        alert("נא למלא את כל השדות");
        return;
    }

    // ניסיון התחברות
    var isConnected = pipwerks.SCORM.init();

    if (!isConnected) {
        console.warn("SCORM Connection Failed - Running in Offline Mode");
    }

    // הכנת המידע לשליחה
    var interactions = [
        {id: "user_name", type: "fill-in", student_response: name, result: "correct"},
        {id: "user_phone", type: "fill-in", student_response: phone, result: "correct"},
        {id: "user_subject", type: "choice", student_response: subject, result: "correct"}
    ];

    if (isConnected) {
        sendInteractionsBatchToLMS(interactions);
        finalizeScorm();
    } else {
        // מצב אופליין/סימולציה
        alert("תודה " + name + "! הטופס נשלח בהצלחה (מצב סימולציה - ללא SCORM)");
        
        // ניקוי הטופס
        document.getElementById('userName').value = "";
        document.getElementById('userPhone').value = "";
        
        // איפוס תפריט הבחירה
        document.getElementById('userSubject').value = "";
        document.getElementById('selectedText').innerText = "נושא הפנייה";
    }
}

function sendInteractionsBatchToLMS(interactions) {
    var scorm = pipwerks.SCORM;
    var count = parseInt(scorm.get('cmi.interactions._count') || '0', 10);

    interactions.forEach(function (item, index) {
        var currentIdx = count + index;
        scorm.set("cmi.interactions." + currentIdx + ".id", item.id);
        scorm.set("cmi.interactions." + currentIdx + ".type", item.type);
        scorm.set("cmi.interactions." + currentIdx + ".student_response", item.student_response);
        scorm.set("cmi.interactions." + currentIdx + ".result", item.result);
        scorm.set("cmi.interactions." + currentIdx + ".correct_responses.0.pattern", "any");
    });
    scorm.save();
}

function finalizeScorm() {
    var scorm = pipwerks.SCORM;
    
    // קביעת ציון וסטטוס
    scorm.set("cmi.core.score.min", "0");
    scorm.set("cmi.core.score.max", "100");
    scorm.set("cmi.core.score.raw", "100");
    scorm.set("cmi.core.lesson_status", "passed");

    scorm.save();
    scorm.quit();

    alert("הפרטים נשלחו בהצלחה למערכת הלמידה!");
}