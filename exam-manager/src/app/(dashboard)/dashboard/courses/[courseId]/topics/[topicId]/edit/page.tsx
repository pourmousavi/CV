import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { TopicForm } from '@/components/courses/topic-form';

interface PageProps {
  params: Promise<{ courseId: string; topicId: string }>;
}

export default async function EditTopicPage({ params }: PageProps) {
  const user = await requireUser();
  const { courseId, topicId } = await params;

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!course) {
    notFound();
  }

  const topic = await prisma.topic.findFirst({
    where: {
      id: topicId,
      courseId,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!topic) {
    notFound();
  }

  return (
    <TopicForm
      courseId={course.id}
      courseName={course.name}
      initialData={topic}
    />
  );
}
