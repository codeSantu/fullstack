import type { PujaScheduleDay } from '@/hooks/usePujaData';

export function SchedulePopoverContent(props: { days: PujaScheduleDay[]; festivalTitle: string }) {
    return (
        <div className="command-grid">
            <div className="stat-card" style={{ gridColumn: 'span 3' }}>
                <div className="stat-icon">🌼</div>
                <div className="stat-label">{props.festivalTitle} :   বাসন্তী দুর্গাপূজা হল মা দুর্গার এক প্রাচীন পূজা যা বসন্তকালে চৈত্র মাসে পালিত হয় এবং যার ঐতিহাসিক উল্লেখ পাওয়া যায় প্রায় খ্রিস্টীয় ৪০০-৬০০ সালের মধ্যে রচিত মার্কণ্ডেয় পুরাণ-এর অন্তর্গত দেবী মহাত্ম্য-এ, যেখানে বলা হয়েছে যে এই পূজার সূচনা করেছিলেন রাজা সুরথ ও সমাধি বৈশ্য, যারা কঠোর ভক্তি ও তপস্যার মাধ্যমে দেবীর কৃপা লাভ করেন, আর সেই ঐতিহ্য থেকেই বসন্তের নবজাগরণের সময় দেবী শক্তির আরাধনা হিসেবে বাসন্তী দুর্গাপূজা আজও বহু স্থানে ভক্তি, আধ্যাত্মিকতা ও সাংস্কৃতিক আনন্দের সঙ্গে উদযাপিত হয় এবং এটি শারদীয় দুর্গাপূজার আগে প্রচলিত প্রাচীনতম দুর্গা পূজার একটি রূপ হিসেবে বিশেষভাবে গুরুত্বপূর্ণ ও শ্রেষ্ঠ বলে বিবেচিত। 🙏🌼</div>
            </div>

            <div className="stat-card" style={{ gridColumn: 'span 3' }}>
                <div className="stat-icon">🗓️</div>
                <div className="stat-label">তিথি:</div>
                <div className="demo-card-desc">
                    {props.days.map((day) => (
                        <div key={day.id}>{day.dateLabel}</div>
                    ))}
                </div>
            </div>

            {props.days.map((day) => (
                <div className="stat-card" key={day.id}>
                    <div className="stat-icon">{day.icon}</div>
                    <div className="stat-label">{day.title}</div>

                    {day.notes ? <p className="demo-card-desc">{day.notes}</p> : null}

                    <div className="stat-label">প্রধান আচার</div>
                    <div className="demo-card-desc">
                        {day.rituals.map((ritual, idx) => (
                            <div key={idx}>• {ritual}</div>
                        ))}
                    </div>

                    {day.materials && day.materials.length > 0 ? (
                        <>
                            <div className="stat-label">প্রয়োজনীয় সামগ্রী</div>
                            <div className="demo-card-desc">
                                {day.materials.map((item, idx) => (
                                    <div key={idx}>• {item}</div>
                                ))}
                            </div>
                        </>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

