import client from './client';

{/*Endpoints para el manejo del currículum */}

export async function getPrograms() {
    const res = await client.get('/curriculum/programs');
    return res.data.programs;
}

export async function getCurriculumSemesters(program) {
    const res = await client.get('/curriculum/semesters', {
        params: { program },
    });
    return res.data.semesters;
}

export async function getCurriculumSubjects(program, semester) {
    const res = await client.get('/curriculum/subjects', {
        params: { program, semester },
    });
    return res.data.subjects;
}
