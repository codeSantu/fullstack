import type { CommitteeSection } from '@/hooks/usePujaData';
import { InlineEditableText } from './InlineEditableText';

interface CommitteePopoverContentProps {
    sections: CommitteeSection[];
    isAdmin?: boolean;
    onSectionsChange?: (next: CommitteeSection[]) => void;
}

export function CommitteePopoverContent({
    sections,
    isAdmin,
    onSectionsChange,
}: CommitteePopoverContentProps) {
    function updateSections(next: CommitteeSection[]) {
        if (onSectionsChange) {
            onSectionsChange(next);
        }
    }

    function handleRenameMember(sectionId: string, roleId: string, index: number, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;

        const next = sections.map((section) =>
            section.id === sectionId
                ? {
                      ...section,
                      roles: section.roles.map((role) =>
                          role.id === roleId
                              ? {
                                    ...role,
                                    members: role.members.map((member, i) =>
                                        i === index ? trimmed : member,
                                    ),
                                }
                              : role,
                      ),
                  }
                : section,
        );

        updateSections(next);
    }

    function handleDeleteMember(sectionId: string, roleId: string, index: number) {
        const next = sections.map((section) =>
            section.id === sectionId
                ? {
                      ...section,
                      roles: section.roles.map((role) =>
                          role.id === roleId
                              ? {
                                    ...role,
                                    members: role.members.filter((_, i) => i !== index),
                                }
                              : role,
                      ),
                  }
                : section,
        );

        updateSections(next);
    }

    function handleAddMember(sectionId: string, roleId: string) {
        const name =
            typeof window !== 'undefined'
                ? window.prompt('নতুন সদস্যের নাম লিখুন')
                : null;
        const trimmed = (name ?? '').trim();
        if (!trimmed) return;

        const next = sections.map((section) =>
            section.id === sectionId
                ? {
                      ...section,
                      roles: section.roles.map((role) =>
                          role.id === roleId
                              ? {
                                    ...role,
                                    members: [...role.members, trimmed],
                                }
                              : role,
                      ),
                  }
                : section,
        );

        updateSections(next);
    }

    return (
        <div className="command-grid">
            {sections.map((section) => (
                <div className="stat-card" style={{ gridColumn: 'span 3' }} key={section.id}>
                    <div className="stat-icon">{section.icon}</div>
                    <div className="stat-label">{section.title}</div>

                    {section.description ? <p className="demo-card-desc">{section.description}</p> : null}

                    {section.roles.map((role) => (
                        <div key={role.id}>
                            <div className="stat-label">{role.label}</div>
                            <div className="demo-card-desc">
                                {role.members.map((member, idx) => (
                                    <div key={idx} className="member-row">
                                        <InlineEditableText
                                            value={member}
                                            isAdmin={!!isAdmin}
                                            onChange={(next) =>
                                                handleRenameMember(section.id, role.id, idx, next)
                                            }
                                        />
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                className="member-delete"
                                                onClick={() =>
                                                    handleDeleteMember(section.id, role.id, idx)
                                                }
                                                aria-label="Remove member"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="member-add"
                                        onClick={() => handleAddMember(section.id, role.id)}
                                    >
                                        + নতুন সদস্য যোগ করুন
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

