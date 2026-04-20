import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MainFrame } from '../components/MainFrame';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  deadline?: string;
  location?: string;
  assigned?: boolean;
  completedAt?: string;
}

export default function TicketsScreen() {
  const navigation = useNavigation<any>();
  const [tasks, setTasks] = useState<Task[]>([
    { id: 3, title: 'Install Gas Pump at Station #42', completed: false, deadline: 'Today, 5:00 PM', location: 'Station #42', assigned: true },
    { id: 4, title: 'Quarterly Safety Inspection', completed: false, deadline: 'Tomorrow, 2:00 PM', location: 'Station #38', assigned: true },
    { id: 5, title: 'Maintenance Check', completed: false, deadline: 'Mar 22, 10:00 AM', location: 'Station #15', assigned: false },
    { id: 6, title: 'Tank Replacement', completed: false, deadline: 'Mar 23, 3:00 PM', location: 'Station #22', assigned: false },
    { id: 1, title: 'Update project documentation', completed: true, assigned: true, completedAt: new Date().toISOString() },
    { id: 2, title: 'Review team feedback', completed: true, assigned: true, completedAt: new Date().toISOString() },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleTaskClick = (task: Task) => {
    if (!task.completed && task.deadline) {
        navigation.navigate('TicketDetail' as never, { taskId: task.id, assigned: task.assigned } as never);
    }
  };

  const assignedTasks = tasks.filter(t => t.assigned && !t.completed);
  const availableTasks = tasks.filter(t => !t.assigned && !t.completed);
  const recentlyCompleted = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const diff = Date.now() - new Date(t.completedAt).getTime();
    return diff <= 24 * 60 * 60 * 1000;
    });

  return (
    <MainFrame header='home'>

        {/* Header */}
        <View style={styles.section}>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>
                {assignedTasks.length} assigned • {availableTasks.length} available
            </Text>
        </View>

        {/* Available Tasks */}
        {availableTasks.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Tasks</Text>
                {availableTasks.map(task => (
                    <TouchableOpacity
                        key={task.id}
                        style={styles.taskCard}
                        onPress={() => handleTaskClick(task)}
                    >
                        <Ionicons name="ellipse-outline" size={20} color="#9ca3af" />
                        <View style={styles.taskText}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            {task.deadline && (
                                <Text style={styles.taskDetail}>
                                    {task.location} • Due {task.deadline}
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                ))}
            </View>
        )}

        {tasks.length === 0 && (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>No tasks available</Text>
            </View>
        )}

        {/* Assigned Tasks */}
        {assignedTasks.length > 0 && (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="briefcase" size={16} color="#ff8c00" />
                    <Text style={styles.sectionTitle}>Assigned to You</Text>
                </View>
                {assignedTasks.map(task => (
                    <TouchableOpacity
                        key={task.id}
                        style={styles.taskCard}
                        onPress={() => handleTaskClick(task)}
                    >
                        <TouchableOpacity onPress={() => toggleTask(task.id)}>
                            <Ionicons
                                name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={task.completed ? '#16a34a' : '#9ca3af'}
                            />
                        </TouchableOpacity>
                        <View style={styles.taskText}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            {task.deadline && (
                                <Text style={styles.taskDetail}>
                                    {task.location} • Due {task.deadline}
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                ))}
            </View>
        )}

        {/* Recently Completed */}
        {recentlyCompleted.length > 0 && (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.sectionTitle}>Completed (Last 24hrs)</Text>
            </View>
            {recentlyCompleted.map(task => (
            <View key={task.id} style={styles.taskCard}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <View style={styles.taskText}>
                <Text style={[styles.taskTitle, { color: '#9ca3af' }]}>{task.title}</Text>
                {task.location && (
                    <Text style={styles.taskDetail}>{task.location}</Text>
                )}
                </View>
            </View>
            ))}
        </View>
        )}
        

    </MainFrame>
 );
}

const CARD_BG = 'rgba(255,255,255,0.1)';
const BORDER  = 'rgba(255,255,255,0.15)';

const styles = StyleSheet.create({
    section: {
        width: '90%',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontFamily: 'poppins-bold',
        color: 'white',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#9ca3af',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontFamily: 'poppins-bold',
        color: 'white',
        marginBottom: 8,
    },
    taskCard: {
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    taskText: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 13,
        fontFamily: 'poppins-bold',
        color: 'white',
    },
    taskDetail: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 13,
        color: '#9ca3af',
    },
});