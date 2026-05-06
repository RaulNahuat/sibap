import { useState, useEffect } from 'react';
import { getCurriculumSemesters, getCurriculumSubjects, getPrograms } from '../../api/curriculum';

export const useCurriculum = (formData, setFormData) => {
    const IS_PROGRAM = 'Licenciatura en Ingeniería de Software';
    const isISProgram = formData.program === IS_PROGRAM;

    const [availablePrograms, setAvailablePrograms] = useState([]);
    const [availableSemesters, setAvailableSemesters] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [selectedSemesterNum, setSelectedSemesterNum] = useState('');
    const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
    const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);

    useEffect(() => {
        setIsLoadingPrograms(true);
        getPrograms()
            .then(progs => setAvailablePrograms(progs))
            .catch(() => setAvailablePrograms([]))
            .finally(() => setIsLoadingPrograms(false));
    }, []);

    useEffect(() => {
        if (formData.program) {
            setIsLoadingSemesters(true);
            getCurriculumSemesters(formData.program)
                .then(sems => setAvailableSemesters(sems))
                .catch(() => setAvailableSemesters([]))
                .finally(() => setIsLoadingSemesters(false));
        } else {
            setAvailableSemesters([]);
            setAvailableSubjects([]);
            setSelectedSemesterNum('');
        }
    }, [formData.program]);

    useEffect(() => {
        if (formData.program && selectedSemesterNum !== '') {
            setIsLoadingSubjects(true);
            getCurriculumSubjects(formData.program, Number(selectedSemesterNum))
                .then(subjects => {
                    setAvailableSubjects(subjects);
                    setFormData(prev => ({ ...prev, subject: '', subject_id: null }));
                })
                .catch(() => setAvailableSubjects([]))
                .finally(() => setIsLoadingSubjects(false));
        }
    }, [selectedSemesterNum, formData.program, setFormData]);

    return {
        IS_PROGRAM,
        isISProgram,
        availablePrograms,
        availableSemesters,
        availableSubjects,
        selectedSemesterNum,
        setSelectedSemesterNum,
        isLoadingPrograms,
        isLoadingSemesters,
        isLoadingSubjects,
        isManualMode,
        setIsManualMode
    };
};
