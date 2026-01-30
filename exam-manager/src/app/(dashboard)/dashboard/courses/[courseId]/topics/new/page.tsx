import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { TopicForm } from '@/components/courses/topic-form';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function NewTopicPage({ params }: PageProps) {
  const user = await requireUser();
  const { courseId } = await params;

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

  return <TopicForm courseId={course.id} courseName={course.name} />;
}
