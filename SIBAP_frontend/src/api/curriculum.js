import client from './client';

/**
 * Obtiene todos los programas educativos disponibles en el catálogo.
 * @returns {Promise<{id: number, nombre: string}[]>}
 */
export async function getPrograms() {
    const res = await client.get('/curriculum/programs');
    return res.data.programs;
}

/**
 * Obtiene los semestres disponibles para un programa educativo.
 * @param {string} program - Nombre completo del programa
 * @returns {Promise<number[]>}
 */
export async function getCurriculumSemesters(program) {
    const res = await client.get('/curriculum/semesters', {
        params: { program },
    });
    return res.data.semesters;
}

/**
 * Obtiene las materias de un semestre para un programa educativo.
 * @param {string} program - Nombre completo del programa
 * @param {number} semester - Número de semestre
 * @returns {Promise<{id: number, clave: string, nombre: string}[]>}
 */
export async function getCurriculumSubjects(program, semester) {
    const res = await client.get('/curriculum/subjects', {
        params: { program, semester },
    });
    return res.data.subjects;
}
