import { database } from '@/lib/database'


export default async function handler(req, res) {

    if (/*req.method === 'POST'*/ true) {
        
        const body = req.body

        var osu = require('node-os-utils')
        var mem = osu.mem
        
        // Allocating os module
        const os = require('os');
        
        let allCpusOld = os.cpus()
        await sleep(1000);
        let allCpus = os.cpus()

        let memInfo = await mem.info()

        let obj = {}
        obj.cpu = []
        obj.memory = {
            totalMb: memInfo.totalMemMb,
            usageMb: memInfo.usedMemMb
        }

        for (let i = 0; i < allCpus.length; i++) {

            let cpu = allCpus[i]

            let cpuOld = allCpusOld[i]

            let allTime = cpu.times.user +
                cpu.times.nice +
                cpu.times.sys +
                cpu.times.idle +
                cpu.times.irq

            let allTimeIdle = cpu.times.idle

            let allTimeOld = cpuOld.times.user +
                cpuOld.times.nice +
                cpuOld.times.sys +
                cpuOld.times.idle +
                cpuOld.times.irq

            let allTimeOldIdle= cpuOld.times.idle

            let workTime = allTime - allTimeOld
            let idleTime = allTimeIdle - allTimeOldIdle

            let objCpu = {}
            objCpu.model = cpu.model
            objCpu.usage = 100-(idleTime/workTime*100)
            

            obj.cpu.push(objCpu)


        }

        res.status(200).json(obj)

    } else {
        // Handle any other HTTP method
    }

}


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}