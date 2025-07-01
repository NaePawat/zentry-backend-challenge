"use client";

import { LineChart, Line, XAxis, YAxis } from 'recharts';

const Chart = ({ name, data }: { name: string, data: { date: string, count: number }[] }) => {

    return (
        <div className='mt-5'>
            <h2 className="text-2xl font-semibold mb-2">{name}</h2>
            <LineChart data={data} width={500} height={500}>
                <XAxis dataKey="date"/>
                <YAxis dataKey="count"  />
                <Line dataKey="count"/>
            </LineChart>
        </div>
    )
}

export default Chart;