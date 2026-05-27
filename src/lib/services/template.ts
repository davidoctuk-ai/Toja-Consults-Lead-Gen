import { prisma } from '../prisma';

export class TemplateService {
  async createTemplate(data: { name: string; subject: string; body: string; variables?: any }) {
    return prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        variables: data.variables || {},
      },
    });
  }

  async getTemplates() {
    return prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: string) {
    return prisma.emailTemplate.findUnique({
      where: { id },
    });
  }

  async updateTemplate(id: string, data: { name?: string; subject?: string; body?: string; variables?: any }) {
    return prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }
}
