"use client";

import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

const Chart = ({ name, data }: { name: string, data: any }) => {

    const countsByMinute: Record<string, number> = {}

    for (const entry of data) {
        const created = parseISO(entry.createdAt)
        const minuteKey = format(created, "yyyy-MM-dd'T'HH:mm:00X") // UTC minute precision

        countsByMinute[minuteKey] = (countsByMinute[minuteKey] || 0) + 1
    }

    const sortedMinutes = Object.keys(countsByMinute).sort()
    const accumulatedResult: { date: string; count: number }[] = []

    let total = 0
    for (const minute of sortedMinutes) {
        total += countsByMinute[minute]
        accumulatedResult.push({
            date: minute,
            count: total,
        })
    }

    console.log(accumulatedResult)

    return (
        <div className='mt-5'>
            <h2 className="text-2xl font-semibold mb-2">{name}</h2>
            <LineChart data={accumulatedResult} width={500} height={500}>
                <XAxis dataKey="date"/>
                <YAxis dataKey="count"  />
                <Line dataKey="count"/>
            </LineChart>
        </div>
    )
}

export default Chart;